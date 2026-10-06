package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

// 위치 공유 연결: 보호자(guardian) 1명 ↔ 보호 대상(protected) 1명
//  - sharing    : 지금 위치 공유가 켜져 있는지
//  - can_toggle : 보호 대상도 공유를 켜고 끌 수 있게 보호자가 허용했는지
//  - changed_by : 마지막으로 공유를 켜거나 끈 쪽 (guardian / protected)
@Entity
@Table(
        name = "user_link",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "link_guardian_protected_uk",
                        columnNames = {"guardian_uuid", "protected_uuid"}
                )
        }
)
public class UserLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @Column(name = "link_uuid", unique = true, nullable = false, length = 36)
    private String link_uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "guardian_uuid",
            referencedColumnName = "user_uuid",
            nullable = false
    )
    private Users guardian;

    // protected 는 자바 예약어라 필드 이름을 protected_user 로 쓴다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "protected_uuid",
            referencedColumnName = "user_uuid",
            nullable = false
    )
    private Users protected_user;

    @Column(name = "sharing", nullable = false)
    private boolean sharing;

    @Column(name = "can_toggle", nullable = false)
    private boolean can_toggle;

    @Column(name = "changed_by", length = 20)
    private String changed_by;


    public int getIdx() { return idx; }
    public void setIdx(int idx) { this.idx = idx; }

    public String getLink_uuid() { return link_uuid; }
    public void setLink_uuid(String link_uuid) { this.link_uuid = link_uuid; }

    public Users getGuardian() { return guardian; }
    public void setGuardian(Users guardian) { this.guardian = guardian; }

    public Users getProtected_user() { return protected_user; }
    public void setProtected_user(Users protected_user) { this.protected_user = protected_user; }

    public boolean isSharing() { return sharing; }
    public void setSharing(boolean sharing) { this.sharing = sharing; }

    public boolean isCan_toggle() { return can_toggle; }
    public void setCan_toggle(boolean can_toggle) { this.can_toggle = can_toggle; }

    public String getChanged_by() { return changed_by; }
    public void setChanged_by(String changed_by) { this.changed_by = changed_by; }
}
