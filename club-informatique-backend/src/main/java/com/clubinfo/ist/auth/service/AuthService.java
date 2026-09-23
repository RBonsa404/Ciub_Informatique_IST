package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.auth.dto.ForgotPasswordRequest;
import com.clubinfo.ist.auth.dto.LoginRequest;
import com.clubinfo.ist.auth.dto.RefreshTokenRequest;
import com.clubinfo.ist.auth.dto.RegisterRequest;
import com.clubinfo.ist.auth.dto.ResetPasswordRequest;
import com.clubinfo.ist.auth.dto.TokenResponse;
import com.clubinfo.ist.auth.dto.TotpSetupResponse;
import com.clubinfo.ist.auth.dto.TotpVerifyRequest;

public interface AuthService {

    TokenResponse register(RegisterRequest request);

    TokenResponse login(LoginRequest request);

    TokenResponse refreshToken(RefreshTokenRequest request);

    void logout(String email);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    TotpSetupResponse setup2fa(String email);

    void verifyAndEnable2fa(String email, TotpVerifyRequest request);

    void disable2fa(String email, TotpVerifyRequest request);
}
