package com.pham.basis.evcharging.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User oAuth2User = super.loadUser(request);
        var attrs = oAuth2User.getAttributes();
        String email = attrs.get("email") instanceof String ? (String) attrs.get("email") : null;
        String url = attrs.get("picture") instanceof String ? (String) attrs.get("picture") : null;
        String name = null;
        if (attrs.get("name") instanceof String) {
            name = (String) attrs.get("name");
        } else {
            String givenName = attrs.get("given_name") instanceof String ? (String) attrs.get("given_name") : null;
            String familyName = attrs.get("family_name") instanceof String ? (String) attrs.get("family_name") : null;
            if (givenName != null || familyName != null) {
                name = String.format("%s %s", givenName != null ? givenName : "", familyName != null ? familyName : "")
                        .trim();
            }
        }

        Object emailVerifiedRaw = attrs.get("email_verified");
        boolean emailVerified = false;
        if (emailVerifiedRaw instanceof Boolean) {
            emailVerified = (Boolean) emailVerifiedRaw;
        } else if (emailVerifiedRaw instanceof String) {
            emailVerified = Boolean.parseBoolean((String) emailVerifiedRaw);
        }

        if (email != null) {
            userService.createOrUpdateFromOAuth(email, name != null ? name : email, emailVerified,url);
        }

        return oAuth2User;
    }
}
