package com.safetymap.safetymap.dto;

import java.util.List;
import java.util.Map;

// 길찾기 결과 경로 1개. path 는 [위도, 경도] 쌍의 목록이라 지도에 선으로 그릴 수 있다.
// route_id 는 "safe"(안전 우선) 또는 "shortest"(최단 거리), source 는 "tmap"(실제 보행자 경로) 또는 "estimate"(직선 추정)
public class RouteDto {

    private String route_id;
    private String name;
    private int score;
    private String grade;
    private boolean score_available;
    private double distance_km;
    private int duration_min;
    private String note;
    private String source;
    private Map<String, Integer> counts;
    private List<double[]> path;
    private List<RouteSegmentDto> segments;

    public RouteDto() {
    }

    public String getRoute_id() { return route_id; }
    public void setRoute_id(String route_id) { this.route_id = route_id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public boolean isScore_available() { return score_available; }
    public void setScore_available(boolean score_available) { this.score_available = score_available; }
    public double getDistance_km() { return distance_km; }
    public void setDistance_km(double distance_km) { this.distance_km = distance_km; }
    public int getDuration_min() { return duration_min; }
    public void setDuration_min(int duration_min) { this.duration_min = duration_min; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Map<String, Integer> getCounts() { return counts; }
    public void setCounts(Map<String, Integer> counts) { this.counts = counts; }
    public List<double[]> getPath() { return path; }
    public void setPath(List<double[]> path) { this.path = path; }
    public List<RouteSegmentDto> getSegments() { return segments; }
    public void setSegments(List<RouteSegmentDto> segments) { this.segments = segments; }
}
