package com.myprofile.myprofileweb.dto;

import com.myprofile.myprofileweb.entity.Profile;

import java.time.LocalDate;

public class CommentsListDto {
    private int idxComment;
    private String postUUID;
    private String userUUID;
    private String profileName;
    private String commentContent;
    private LocalDate createdAt;

    public CommentsListDto() {

    }

    public CommentsListDto(int idxComment, String postUUID, String userUUID, String profileName, String commentContent, LocalDate createdAt) {
        this.idxComment = idxComment;
        this.postUUID = postUUID;
        this.userUUID = userUUID;
        this.profileName = profileName;
        this.commentContent = commentContent;
        this.createdAt = createdAt;
    }

    public int getIdxComment() {
        return idxComment;
    }

    public void setIdxComment(int idxComment) {
        this.idxComment = idxComment;
    }

    public String getPostUUID() {
        return postUUID;
    }

    public void setPostUUID(String postUUID) {
        this.postUUID = postUUID;
    }

    public String getUserUUID() {
        return userUUID;
    }

    public void setUserUUID(String userUUID) {
        this.userUUID = userUUID;
    }

    public String getProfileName() {
        return profileName;
    }

    public void setProfileName(String profileName) {
        this.profileName = profileName;
    }

    public String getCommentContent() {
        return commentContent;
    }

    public void setCommentContent(String commentContent) {
        this.commentContent = commentContent;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }
}
