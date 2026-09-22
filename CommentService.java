package com.myprofile.myprofileweb.service;

import com.myprofile.myprofileweb.dto.CommentsListDto;
import com.myprofile.myprofileweb.dto.CommentsUploadRequestDto;
import com.myprofile.myprofileweb.entity.Comments;
import com.myprofile.myprofileweb.repository.CommentsRepository;
import com.myprofile.myprofileweb.repository.PostsRepository;
import com.myprofile.myprofileweb.repository.ProfileRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class CommentService {

    private final PostsRepository postsRepository;
    private final CommentsRepository commentsRepository;
    private final ProfileRepository profileRepository;

    public CommentService(PostsRepository postsRepository, CommentsRepository commentsRepository, ProfileRepository profileRepository) {
        this.postsRepository = postsRepository;
        this.commentsRepository = commentsRepository;
        this.profileRepository = profileRepository;
    }

    // 게시글의 댓글 가져오기
    public Slice<CommentsListDto> getCommentList(String postUUID, Pageable pageable) {
        Slice<Comments> listRaw = commentsRepository.findAllByPost_PostUUID(postUUID, pageable);
        return listRaw.map(comment ->
                new CommentsListDto(
                        comment.getIdxComment(),
                        comment.getPost().getPostUUID(),
                        comment.getProfile().getUserUUID(),
                        comment.getProfile().getProfileName(),
                        comment.getCommentContent(),
                        comment.getCreatedAt()
                )
        );
    }

    // 게시글에 댓글 쓰기
    public void uploadComment(CommentsUploadRequestDto dto, String postUUID, String userUUID) {
        Comments comment = new Comments();

        comment.setPost(
                postsRepository.findByPostUUID(postUUID)
                        .orElseThrow()
        );

        comment.setProfile(
                profileRepository.findByUserUUID(userUUID)
                        .orElseThrow()
        );

        comment.setCommentUUID(dto.getCommentUUID());
        comment.setCommentContent(dto.getCommentContent());
        comment.setCreatedAt(LocalDate.now());

        commentsRepository.save(comment);
    }

    // 유저UUID와 댓글UUID로 댓글 삭제
    public boolean deleteComment(int idxComment, String userUUID) {
        Comments comment = commentsRepository.findByIdxComment(idxComment);
        if(comment.getProfile().getUserUUID().equals(userUUID)) {
            commentsRepository.deleteById(idxComment);
            return true;
        } else {
            return false;
        }
    }
}
