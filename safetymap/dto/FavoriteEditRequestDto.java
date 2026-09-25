package com.safetymap.safetymap.dto;

public class FavoriteEditRequestDto {

    private String fav_name;

    public FavoriteEditRequestDto() {

    }

    public FavoriteEditRequestDto(String fav_name) {
        this.fav_name = fav_name;
    }

    public String getFav_name() {
        return fav_name;
    }

    public void setFav_name(String fav_name) {
        this.fav_name = fav_name;
    }
}