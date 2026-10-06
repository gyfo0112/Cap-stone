package com.safetymap.safetymap.dto;

// 경로 구간 1개 (길 이름 단위) — 구간별 안전 요인 화면에 쓴다
public class RouteSegmentDto {

    private String name;
    private int meters;
    private int score;
    private String grade;
    private String note;

    public RouteSegmentDto() {
    }

    public RouteSegmentDto(String name, int meters, int score, String grade, String note) {
        this.name = name;
        this.meters = meters;
        this.score = score;
        this.grade = grade;
        this.note = note;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getMeters() { return meters; }
    public void setMeters(int meters) { this.meters = meters; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
