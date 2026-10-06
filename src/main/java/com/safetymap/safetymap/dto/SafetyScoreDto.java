package com.safetymap.safetymap.dto;

import java.util.Map;

// 장소 한 곳의 안전점수 (주변 시설 기준)
public class SafetyScoreDto {

    private int score;
    private String grade;
    private boolean score_available;
    private int radius_m;
    private String note;
    private Map<String, Integer> counts;

    public SafetyScoreDto() {
    }

    public SafetyScoreDto(int score, String grade, boolean score_available, int radius_m, String note, Map<String, Integer> counts) {
        this.score = score;
        this.grade = grade;
        this.score_available = score_available;
        this.radius_m = radius_m;
        this.note = note;
        this.counts = counts;
    }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public boolean isScore_available() { return score_available; }
    public void setScore_available(boolean score_available) { this.score_available = score_available; }
    public int getRadius_m() { return radius_m; }
    public void setRadius_m(int radius_m) { this.radius_m = radius_m; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Map<String, Integer> getCounts() { return counts; }
    public void setCounts(Map<String, Integer> counts) { this.counts = counts; }
}
