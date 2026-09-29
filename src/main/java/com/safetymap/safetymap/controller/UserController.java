package com.safetymap.safetymap.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class UserController {
    
    // 로그인 폼 페이지 이동
    @GetMapping("/login")
    public String loginFormRequest(){
        return "user/login";
    }

}
