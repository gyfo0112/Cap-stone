package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.MarkerPublicDto;
import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.exception.BadRequestException;
import com.safetymap.safetymap.exception.NotFoundException;
import com.safetymap.safetymap.repository.MarkerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MarkerService {

    // 사용자가 즐겨찾기한 장소(집, 학교 등)의 marker_type. 안전시설이 아니라서 지도 마커 목록에는 내보내지 않는다
    public static final String PLACE_TYPE = "PLACE";

    private static final int MARKER_NAME_MAX_LENGTH = 50;

    private final MarkerRepository markerRepository;

    public MarkerService(MarkerRepository markerRepository) {
        this.markerRepository = markerRepository;
    }

    // 지도 범위 안의 마커 목록 가져오기 (marker_type 이 있으면 종류로 거른다)
    public List<MarkerPublicDto> getMarkersInBounds(double min_latitude,
                                                    double max_latitude,
                                                    double min_longitude,
                                                    double max_longitude,
                                                    String marker_type) {

        List<Marker> listRaw;

        // 지도 범위가 뒤집혀 있으면(최소 > 최대) 잘못된 요청 → 400
        if (min_latitude > max_latitude || min_longitude > max_longitude) {
            throw new BadRequestException("지도 범위가 올바르지 않습니다.");
        }

        // PLACE(사용자 즐겨찾기 장소)는 일반 지도 조회에 내보내지 않는다 (기존 정책 유지)
        if (marker_type == null || marker_type.isBlank()) {
            listRaw = markerRepository.findAllInBounds(min_latitude, max_latitude, min_longitude, max_longitude);
        } else if (PLACE_TYPE.equals(marker_type.trim())) {
            listRaw = new ArrayList<>();
        } else {
            listRaw = markerRepository.findAllInBoundsByType(marker_type.trim(), min_latitude, max_latitude, min_longitude, max_longitude);
        }

        List<MarkerPublicDto> list = new ArrayList<>();

        for (Marker marker : listRaw) {
            list.add(toMarkerPublicDto(marker));
        }

        return list;
    }

    // UUID로 마커 1개 가져오기 (없으면 404)
    public MarkerPublicDto getMarker(String marker_uuid) {
        return toMarkerPublicDto(getMarkerEntity(marker_uuid));
    }

    // 마커 엔티티 가져오기. 즐겨찾기 서비스도 이걸 쓴다 (없으면 404)
    public Marker getMarkerEntity(String marker_uuid) {
        if (marker_uuid == null || marker_uuid.isBlank()) {
            throw new NotFoundException("마커를 찾을 수 없습니다.");
        }

        return markerRepository.findByMarkerUuid(marker_uuid.trim())
                .orElseThrow(() -> new NotFoundException("마커를 찾을 수 없습니다."));
    }

    // 같은 이름·좌표의 장소 마커 찾기 (없으면 null)
    public Marker getPlaceMarkerEntity(String marker_name, double latitude, double longitude) {
        if (marker_name == null || marker_name.isBlank()) {
            return null;
        }

        List<Marker> found = markerRepository.findAllPlaces(cutMarkerName(marker_name), latitude, longitude);
        if (found.isEmpty()) {
            return null;
        }

        return found.get(0);
    }

    // 즐겨찾기할 장소 마커 가져오기. 같은 이름·좌표의 장소가 이미 있으면 그것을 쓰고, 없으면 새로 만든다
    public Marker getOrCreatePlaceMarker(String marker_name, double latitude, double longitude) {
        Marker found = getPlaceMarkerEntity(marker_name, latitude, longitude);
        if (found != null) {
            return found;
        }

        String name = cutMarkerName(marker_name);

        Marker marker = new Marker();

        marker.setMarker_uuid(UUID.randomUUID().toString());
        marker.setMarker_name(name);
        marker.setMarker_type(PLACE_TYPE);
        marker.setLatitude(latitude);
        marker.setLongitude(longitude);

        markerRepository.save(marker);

        return marker;
    }

    // 마커 이름 다듬기 (컬럼 길이 50자에 맞춘다)
    private String cutMarkerName(String marker_name) {
        String name = marker_name.trim();

        if (name.length() > MARKER_NAME_MAX_LENGTH) {
            name = name.substring(0, MARKER_NAME_MAX_LENGTH);
        }

        return name;
    }

    // 엔티티를 응답용 DTO로 바꾸기
    private MarkerPublicDto toMarkerPublicDto(Marker marker) {
        return new MarkerPublicDto(
                marker.getMarker_uuid(),
                marker.getMarker_name(),
                marker.getMarker_type(),
                marker.getLatitude(),
                marker.getLongitude()
        );
    }
}