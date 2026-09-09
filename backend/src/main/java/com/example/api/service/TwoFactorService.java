package com.example.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwoFactorService {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorService.class);
    private final SecureRandom random = new SecureRandom();

    private static class OtpEntry {
        String code;
        LocalDateTime expiration;

        OtpEntry(String code, LocalDateTime expiration) {
            this.code = code;
            this.expiration = expiration;
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

    /**
     * Génère un code OTP à 6 chiffres valable 5 minutes
     */
    public String generateOtp(String email) {
        int number = 100000 + random.nextInt(900000);
        String code = String.valueOf(number);
        otpStorage.put(email, new OtpEntry(code, LocalDateTime.now().plusMinutes(5)));

        log.info("=================================================");
        log.info(" [2FA OTP] Code généré pour {}: {}", email, code);
        log.info(" (Valable 5 minutes)");
        log.info("=================================================");

        return code;
    }

    public boolean verifyOtp(String email, String code) {
        OtpEntry entry = otpStorage.get(email);
        if (entry == null) {
            return false;
        }
        if (LocalDateTime.now().isAfter(entry.expiration)) {
            otpStorage.remove(email);
            return false;
        }
        boolean isValid = entry.code.equals(code);
        if (isValid) {
            otpStorage.remove(email);
        }
        return isValid;
    }
}
