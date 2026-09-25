package com.safetymap.safetymap.dto;

public class FavoriteListDto {

    private String user_uuid;
    private String marker_uuid;
    private String marker_name;
    private String marker_type;
    private double latitude;
    private double longitude;
    private String fav_name;

    public FavoriteListDto() {

    }

    public FavoriteListDto(String user_uuid, String marker_uuid, String marker_name, String marker_type, double latitude, double longitude, String fav_name) {
        this.user_uuid = user_uuid;
        this.marker_uuid = marker_uuid;
        this.marker_name = marker_name;
        this.marker_type = marker_type;
        this.latitude = latitude;
        this.longitude = longitude;
        this.fav_name = fav_name;
    }

    public String getUser_uuid() {
        return user_uuid;
    }

    public void setUser_uuid(String user_uuid) {
        this.user_uuid = user_uuid;
    }

    public String getMarker_uuid() {
        return marker_uuid;
    }

    public void setMarker_uuid(String marker_uuid) {
        this.marker_uuid = marker_uuid;
    }

    public String getMarker_name() {
        return marker_name;
    }

    public void setMarker_name(String marker_name) {
        this.marker_name = marker_name;
    }

    public String getMarker_type() {
        return marker_type;
    }

    public void setMarker_type(String marker_type) {
        this.marker_type = marker_type;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getFav_name() {
        return fav_name;
    }

    public void setFav_name(String fav_name) {
        this.fav_name = fav_name;
    }
}