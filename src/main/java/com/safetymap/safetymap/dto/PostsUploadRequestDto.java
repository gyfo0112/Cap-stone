package com.safetymap.safetymap.dto;

public class PostsUploadRequestDto {

    private String post_title;
    private String post_type;
    private String body;
    private Double latitude;
    private Double longitude;

    // Getter & Setter
    public String getPost_title() { return post_title; }
    public void setPost_title(String post_title) { this.post_title = post_title; }

    public String getPost_type() { return post_type; }
    public void setPost_type(String post_type) { this.post_type = post_type; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}