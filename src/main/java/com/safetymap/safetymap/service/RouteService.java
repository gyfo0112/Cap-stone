package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.RouteDto;
import com.safetymap.safetymap.dto.RouteSegmentDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// 길찾기 — TMAP 보행자 경로 API 로 후보 경로(대로우선·최단·추천)를 받아, 각 경로 주변의 안전시설로 점수를 매기고
// "안전 우선"(점수 최고)과 "최단 거리"(가장 짧은 길) 두 가지로 돌려준다.
// TMAP 키(tmap.app-key, 환경변수 TMAP_APP_KEY)가 없거나 TMAP 호출이 모두 실패하면 출발지~도착지 직선으로 추정한다(source="estimate").
@Service
public class RouteService {

    private static final Logger log = LoggerFactory.getLogger(RouteService.class);

    // TMAP 보행자 경로 searchOption: 4 = 추천 + 대로우선, 10 = 최단, 0 = 추천
    private static final List<String> SEARCH_OPTIONS = List.of("4", "10", "0");
    private static final double MIN_DISTANCE_M = 10;
    private static final double MAX_DISTANCE_M = 10_000;
    private static final double MARGIN_M = 60;               // 경로 둘레로 시설을 읽어 올 여유
    private static final double WALK_METERS_PER_SECOND = 1.3; // 직선 추정 때의 보행 속도
    private static final int MAX_PATH_POINTS = 400;          // 응답에 싣는 경로 좌표 수 상한
    private static final double MIN_SEGMENT_M = 50;          // 이보다 짧은 구간(횡단보도·연결로 등)은 이웃 구간에 합친다
    private static final String GENERIC_ROAD = "보행자도로";    // TMAP 이 길 이름을 안 주거나 일반 보행로일 때 쓰는 이름
    private static final long CACHE_MS = 10 * 60 * 1000L;    // TMAP 응답은 10분 동안 재사용(무료 호출 한도 아끼기)
    private static final int CACHE_MAX = 200;

    private final SafetyScoreService safetyScoreService;
    private final RestClient restClient = RestClient.create();
    // ponytail: 단순 메모리 캐시 — 가득 차면 전부 비운다. 여러 서버로 늘리면 Redis 등으로 교체
    private final Map<String, CachedCandidate> cache = new ConcurrentHashMap<>();

    @Value("${tmap.app-key:}")
    private String tmapAppKey;

    // 테스트에서 가짜 서버로 바꿔 끼울 수 있게 주소도 설정값으로 둔다 (기본은 TMAP 보행자 경로)
    @Value("${tmap.url:https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1}")
    private String tmapUrl;

    public RouteService(SafetyScoreService safetyScoreService) {
        this.safetyScoreService = safetyScoreService;
    }

    record Seg(String name, List<RouteScorer.Point> path) {
    }

    record Candidate(List<RouteScorer.Point> path, double distance_m, int time_s, List<Seg> segs, String source) {
    }

    private record CachedCandidate(long at, Candidate candidate) {
    }

    private record Scored(Candidate candidate, RouteScorer.Score score) {
    }

    // 출발지~도착지 경로 두 가지(안전 우선, 최단 거리). 입력이 잘못되면 IllegalArgumentException.
    public List<RouteDto> findRoutes(RouteScorer.Point origin, RouteScorer.Point destination, String time) {
        double straight = RouteScorer.distanceM(origin, destination);
        if (straight < MIN_DISTANCE_M) {
            throw new IllegalArgumentException("출발지와 도착지가 같은 곳이에요");
        }
        if (straight > MAX_DISTANCE_M) {
            throw new IllegalArgumentException("걸어가기엔 너무 먼 거리예요 (10km 이내만 찾을 수 있어요)");
        }

        List<Candidate> candidates = fetchCandidates(origin, destination);
        if (candidates.isEmpty()) {
            candidates = List.of(estimate(origin, destination));
        }

        // 후보 경로들을 모두 덮는 사각형 안의 시설을 한 번에 읽어 온다
        double minLat = Double.MAX_VALUE;
        double maxLat = -Double.MAX_VALUE;
        double minLng = Double.MAX_VALUE;
        double maxLng = -Double.MAX_VALUE;
        for (Candidate c : candidates) {
            for (RouteScorer.Point p : c.path()) {
                minLat = Math.min(minLat, p.lat());
                maxLat = Math.max(maxLat, p.lat());
                minLng = Math.min(minLng, p.lng());
                maxLng = Math.max(maxLng, p.lng());
            }
        }
        double dLat = MARGIN_M / 111320.0;
        double dLng = MARGIN_M / (111320.0 * Math.cos(Math.toRadians((minLat + maxLat) / 2)));
        RouteScorer.MarkerIndex index = safetyScoreService.loadIndex(minLat - dLat, maxLat + dLat, minLng - dLng, maxLng + dLng);

        boolean night = safetyScoreService.isNight(time);
        List<Scored> scored = new ArrayList<>();
        for (Candidate c : candidates) {
            scored.add(new Scored(c, RouteScorer.score(RouteScorer.densify(c.path(), RouteScorer.STEP_M), index, night, RouteScorer.ROUTE_RADIUS_M)));
        }

        Scored safe = scored.stream()
                .max(Comparator.comparingInt((Scored s) -> s.score().score()).thenComparing(s -> -s.candidate().distance_m()))
                .orElseThrow();
        Scored shortest = scored.stream()
                .min(Comparator.comparingDouble((Scored s) -> s.candidate().distance_m()).thenComparing(s -> -s.score().score()))
                .orElseThrow();

        List<RouteDto> result = new ArrayList<>();
        result.add(toDto("safe", "안전 우선 경로", safe, index, night, safe == shortest ? "최단 거리와 같은 길이에요" : null));
        result.add(toDto("shortest", "최단 거리", shortest, index, night, null));
        return result;
    }

    // ---- TMAP ----

    private List<Candidate> fetchCandidates(RouteScorer.Point origin, RouteScorer.Point destination) {
        List<Candidate> out = new ArrayList<>();
        if (tmapAppKey == null || tmapAppKey.isBlank()) {
            return out;
        }
        Set<String> seen = new HashSet<>();
        for (String option : SEARCH_OPTIONS) {
            Candidate c = callTmap(origin, destination, option);
            // 옵션이 달라도 같은 길이면 한 번만 쓴다
            if (c != null && seen.add(Math.round(c.distance_m()) + ":" + c.path().size())) {
                out.add(c);
            }
        }
        return out;
    }

    private Candidate callTmap(RouteScorer.Point origin, RouteScorer.Point destination, String option) {
        String key = String.format("%.5f,%.5f>%.5f,%.5f|%s", origin.lat(), origin.lng(), destination.lat(), destination.lng(), option);
        CachedCandidate hit = cache.get(key);
        if (hit != null && System.currentTimeMillis() - hit.at() < CACHE_MS) {
            return hit.candidate();
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("startX", origin.lng());
            body.put("startY", origin.lat());
            body.put("endX", destination.lng());
            body.put("endY", destination.lat());
            body.put("reqCoordType", "WGS84GEO");
            body.put("resCoordType", "WGS84GEO");
            body.put("startName", URLEncoder.encode("출발지", StandardCharsets.UTF_8));
            body.put("endName", URLEncoder.encode("도착지", StandardCharsets.UTF_8));
            body.put("searchOption", option);

            Map<String, Object> response = restClient.post()
                    .uri(tmapUrl)
                    .header("appKey", tmapAppKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            Candidate candidate = parseTmap(response);
            if (candidate != null) {
                if (cache.size() >= CACHE_MAX) {
                    cache.clear();
                }
                cache.put(key, new CachedCandidate(System.currentTimeMillis(), candidate));
            }
            return candidate;
        } catch (RuntimeException e) {
            log.warn("TMAP 보행자 경로 호출 실패 (searchOption={}): {}", option, e.getMessage());
            return null;
        }
    }

    // TMAP 응답(GeoJSON FeatureCollection) → 후보 경로. 길 모양이 아니면(Point) 건너뛰고, 같은 길 이름이 이어지면 한 구간으로 합친다.
    static Candidate parseTmap(Map<String, Object> response) {
        if (response == null || !(response.get("features") instanceof List<?> features)) {
            return null;
        }
        List<RouteScorer.Point> path = new ArrayList<>();
        List<Seg> segs = new ArrayList<>();
        double totalDistance = -1;
        int totalTime = -1;

        for (Object featureObj : features) {
            if (!(featureObj instanceof Map<?, ?> feature)) {
                continue;
            }
            Map<?, ?> properties = feature.get("properties") instanceof Map<?, ?> p ? p : Map.of();
            if (totalDistance < 0 && properties.get("totalDistance") instanceof Number n) {
                totalDistance = n.doubleValue();
            }
            if (totalTime < 0 && properties.get("totalTime") instanceof Number n) {
                totalTime = n.intValue();
            }
            if (!(feature.get("geometry") instanceof Map<?, ?> geometry) || !"LineString".equals(geometry.get("type"))
                    || !(geometry.get("coordinates") instanceof List<?> coordinates)) {
                continue;
            }
            List<RouteScorer.Point> part = new ArrayList<>();
            for (Object coordObj : coordinates) {
                if (coordObj instanceof List<?> c && c.size() >= 2 && c.get(0) instanceof Number lng && c.get(1) instanceof Number lat) {
                    part.add(new RouteScorer.Point(lat.doubleValue(), lng.doubleValue()));
                }
            }
            if (part.size() < 2) {
                continue;
            }
            path.addAll(path.isEmpty() ? part : part.subList(1, part.size()));

            String name = properties.get("name") instanceof String s && !s.isBlank() ? s.trim() : GENERIC_ROAD;
            segs.add(new Seg(name, part));
        }
        if (path.size() < 2) {
            return null;
        }
        double distance = totalDistance > 0 ? totalDistance : RouteScorer.lengthM(path);
        int time = totalTime > 0 ? totalTime : (int) Math.round(distance / WALK_METERS_PER_SECOND);
        return new Candidate(path, distance, time, tidySegments(segs), "tmap");
    }

    // TMAP 은 횡단보도·연결로마다 조각을 내서 같은 길이 "큰길-보행로-큰길-보행로"처럼 잘게 쪼개져 온다.
    // 같은 이름이 이어지면 합치고, MIN_SEGMENT_M 보다 짧은 조각은 이웃 조각에 합쳐 구간 수를 줄인다.
    static List<Seg> tidySegments(List<Seg> raw) {
        List<Seg> segs = mergeSameName(raw);
        boolean changed = true;
        while (changed && segs.size() > 1) {
            changed = false;
            for (int i = 0; i < segs.size(); i++) {
                if (RouteScorer.lengthM(segs.get(i).path()) >= MIN_SEGMENT_M) {
                    continue;
                }
                // 짧은 조각은 더 긴 쪽 이웃에 붙인다(처음·끝이면 하나뿐인 이웃)
                int target;
                if (i == 0) {
                    target = 1;
                } else if (i == segs.size() - 1) {
                    target = i - 1;
                } else {
                    target = RouteScorer.lengthM(segs.get(i - 1).path()) >= RouteScorer.lengthM(segs.get(i + 1).path()) ? i - 1 : i + 1;
                }
                Seg short_ = segs.get(i);
                Seg neighbor = segs.get(target);
                Seg joined = target < i
                        ? new Seg(neighbor.name(), joinPaths(neighbor.path(), short_.path()))
                        : new Seg(neighbor.name(), joinPaths(short_.path(), neighbor.path()));
                segs.set(target, joined);
                segs.remove(i);
                segs = mergeSameName(segs);
                changed = true;
                break;
            }
        }
        return segs;
    }

    private static List<Seg> mergeSameName(List<Seg> segs) {
        List<Seg> out = new ArrayList<>();
        for (Seg seg : segs) {
            Seg last = out.isEmpty() ? null : out.get(out.size() - 1);
            if (last != null && last.name().equals(seg.name())) {
                out.set(out.size() - 1, new Seg(last.name(), joinPaths(last.path(), seg.path())));
            } else {
                out.add(seg);
            }
        }
        return out;
    }

    // 앞 조각의 끝과 뒤 조각의 처음이 같은 점이면 한 번만 넣고 이어 붙인다
    private static List<RouteScorer.Point> joinPaths(List<RouteScorer.Point> a, List<RouteScorer.Point> b) {
        List<RouteScorer.Point> joined = new ArrayList<>(a);
        joined.addAll(a.get(a.size() - 1).equals(b.get(0)) ? b.subList(1, b.size()) : b);
        return joined;
    }

    // 직선 추정 — TMAP 을 쓸 수 없을 때. 300m 넘으면 3구간으로 나눠 구간별 점수를 보여준다.
    private Candidate estimate(RouteScorer.Point origin, RouteScorer.Point destination) {
        double distance = RouteScorer.distanceM(origin, destination);
        int parts = distance > 300 ? 3 : 1;
        List<Seg> segs = new ArrayList<>();
        for (int i = 0; i < parts; i++) {
            segs.add(new Seg("구간 " + (i + 1), List.of(lerp(origin, destination, (double) i / parts), lerp(origin, destination, (double) (i + 1) / parts))));
        }
        return new Candidate(List.of(origin, destination), distance, (int) Math.round(distance / WALK_METERS_PER_SECOND), segs, "estimate");
    }

    private static RouteScorer.Point lerp(RouteScorer.Point a, RouteScorer.Point b, double t) {
        return new RouteScorer.Point(a.lat() + (b.lat() - a.lat()) * t, a.lng() + (b.lng() - a.lng()) * t);
    }

    // ---- 응답 만들기 ----

    private RouteDto toDto(String id, String name, Scored scored, RouteScorer.MarkerIndex index, boolean night, String extraNote) {
        Candidate c = scored.candidate();
        RouteScorer.Score s = scored.score();

        List<RouteSegmentDto> segments = new ArrayList<>();
        for (Seg seg : c.segs()) {
            RouteScorer.Score ss = RouteScorer.score(RouteScorer.densify(seg.path(), RouteScorer.STEP_M), index, night, RouteScorer.ROUTE_RADIUS_M);
            segments.add(new RouteSegmentDto(
                    seg.name(),
                    (int) Math.round(RouteScorer.lengthM(seg.path())),
                    ss.score(),
                    ss.has_data() ? RouteScorer.grade(ss.score()) : "보통",
                    ss.has_data() ? RouteScorer.describe(ss.counts()) : "안전시설 데이터가 없어 점수를 계산하지 못했어요"));
        }

        List<String> notes = new ArrayList<>();
        notes.add(s.has_data() ? RouteScorer.describe(s.counts()) : "안전시설 데이터가 없어 점수를 계산하지 못했어요");
        if ("estimate".equals(c.source())) {
            notes.add("직선 추정 경로예요 (실제 보행 길과 다를 수 있어요)");
        }
        if (extraNote != null) {
            notes.add(extraNote);
        }

        RouteDto dto = new RouteDto();
        dto.setRoute_id(id);
        dto.setName(name);
        dto.setScore(s.score());
        dto.setGrade(s.has_data() ? RouteScorer.grade(s.score()) : "보통");
        dto.setScore_available(s.has_data());
        dto.setDistance_km(Math.round(c.distance_m() / 100.0) / 10.0);
        dto.setDuration_min(Math.max(1, (int) Math.round(c.time_s() / 60.0)));
        dto.setNote(String.join(" · ", notes));
        dto.setSource(c.source());
        dto.setCounts(s.counts());
        dto.setPath(simplify(c.path()));
        dto.setSegments(segments);
        return dto;
    }

    // 좌표가 너무 많으면 일정 간격으로 줄이고(처음·끝은 유지) 소수 6자리로 줄인다
    private static List<double[]> simplify(List<RouteScorer.Point> path) {
        int step = Math.max(1, (int) Math.ceil((double) path.size() / MAX_PATH_POINTS));
        List<double[]> out = new ArrayList<>();
        for (int i = 0; i < path.size(); i += step) {
            out.add(round(path.get(i)));
        }
        if ((path.size() - 1) % step != 0) {
            out.add(round(path.get(path.size() - 1)));
        }
        return out;
    }

    private static double[] round(RouteScorer.Point p) {
        return new double[]{Math.round(p.lat() * 1e6) / 1e6, Math.round(p.lng() * 1e6) / 1e6};
    }
}
