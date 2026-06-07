package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.RegisterRequest;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.Role;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Optional;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.nexcoffee.managementsystem.dto.request.LoginRequest;
import com.nexcoffee.managementsystem.dto.response.AuthResponse;



import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public String register(RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());

        if (existingUser.isPresent()) {
            User user = existingUser.get();

            if (!user.isVerified()) {
                throw new RuntimeException("Email này đã được đăng ký nhưng chưa xác thực. Vui lòng gửi lại email xác thực.");
            }

            throw new RuntimeException("Email đã được sử dụng!");
        }

        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Số điện thoại đã được sử dụng!");
        }

        if (!request.getPassword().equals(request.getPasswordConfirmation())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp!");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .status("ACTIVE")
                .isVerified(false)
                .tokenExpiryDate(LocalDateTime.now().plusHours(24))
                .verificationToken(UUID.randomUUID().toString())
                .build();

        userRepository.save(user);

        try {
            sendVerificationEmail(user);
        } catch (Exception e) {
            return "Đăng ký thành công nhưng không thể gửi email xác thực. Vui lòng yêu cầu gửi lại mã.";
        }

        return "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String buildVerificationEmailTemplate(String fullName, String verifyUrl) {
        String template = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác thực tài khoản NexCoffee</title>
            </head>
            <body style="margin:0;
                                                                                                                         padding:0;
                                                                                                                         background-color:#f4f0ec;
                                                                                                                         font-family:'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                       style="width:100%; background-color:#f4f0ec; padding:32px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                   style="max-width:600px; width:100%; background-color:#ffffff; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.12);">
                                
                                <tr>
                                    <td align="center" style="background-color:#391b09; padding:28px 20px;">
                                        <div style="font-size:30px; font-weight:700; letter-spacing:0.5px;">
                                            <span style="color:#ffffff;">NexCoffee</span>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:40px 36px 30px 36px; color:#3d2415;">
                                        <h1 style="margin:0 0 26px 0; color:#391b09; text-align:center; font-family:'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size:25px; line-height:1.5; font-weight:700; letter-spacing:0;">
                                            XÁC THỰC TÀI KHOẢN<br>
                                            NexCoffee
                                        </h1>

                                        <p style="margin:0 0 16px 0; font-size:16px; color:#3d2415;">
                                            Chào <strong>{{FULL_NAME}}</strong>,
                                        </p>

                                        <p style="margin:0 0 30px 0; font-size:16px; line-height:1.7; color:#4f382a;">
                                            Cảm ơn bạn đã đăng ký NexCoffee. Vui lòng xác thực địa chỉ email của bạn
                                            để bắt đầu đặt hàng cà phê yêu thích.
                                        </p>

                                        <div style="text-align:center; margin:32px 0;">
                                            <a href="{{VERIFY_URL}}"
                                               style="display:inline-block; background-color:#ff8914; color:#ffffff; text-decoration:none;
                                                      padding:15px 34px; border-radius:14px; font-size:16px; font-weight:700;">
                                                XÁC THỰC EMAIL
                                            </a>
                                        </div>

                                        <div style="margin-top:30px; padding:18px 20px; border-top:2px solid #d8c8bd; background-color:#fffaf6;">
                                            <p style="margin:0 0 12px 0; font-size:13px; line-height:1.6; color:#7a5d4a;">
                                                Nếu bạn gặp khó khăn khi nhấn nút "Xác thực Email", vui lòng sao chép
                                                và dán liên kết bên dưới vào trình duyệt của bạn:
                                            </p>

                                            <p style="margin:0; word-break:break-all;">
                                                <a href="{{VERIFY_URL}}" style="font-size:13px; color:#4f83cc; text-decoration:underline;">
                                                    {{VERIFY_URL}}
                                                </a>
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding:20px 30px 28px 30px; font-size:12px; color:#888888;">
                                        © 2026 NexCoffee. Mọi quyền được bảo lưu.
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """;

        return template
                .replace("{{FULL_NAME}}", escapeHtml(fullName))
                .replace("{{VERIFY_URL}}", verifyUrl);
    }

    private void sendVerificationEmail(User user) {
        String verifyUrl = "http://localhost:5173/verify?token=" + user.getVerificationToken();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(user.getEmail());
            helper.setSubject("Xác thực tài khoản NexCoffee");

            String htmlContent = buildVerificationEmailTemplate(
                    user.getFullName(),
                    verifyUrl
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại sau.", e);
        }
    }

    public String verifyUser(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new RuntimeException("Mã xác thực không hợp lệ.");
        }

        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Liên kết xác thực không hợp lệ hoặc đã được sử dụng."));

        if (user.isVerified()) {
            return "Tài khoản đã được xác thực từ trước.";
        }

        if (user.getTokenExpiryDate() == null || user.getTokenExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã xác thực đã hết hạn! Vui lòng yêu cầu mã mới.");
        }

        user.setVerified(true);
        user.setVerificationToken(null);
        user.setTokenExpiryDate(null);

        userRepository.save(user);

        return "Xác thực tài khoản thành công!";
    }

    public String resendVerificationToken(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống!");
        }

        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        if (user.isVerified()) {
            throw new RuntimeException("Tài khoản này đã được xác thực từ trước.");
        }

        user.setVerificationToken(UUID.randomUUID().toString());
        user.setTokenExpiryDate(LocalDateTime.now().plusHours(24));
        user.setVerified(false);

        userRepository.save(user);

        sendVerificationEmail(user);

        return "Mã xác thực mới đã được gửi vào email của bạn!";
    }
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        if (!user.isVerified()) {
            throw new RuntimeException("Tài khoản chưa được xác thực email. Vui lòng kiểm tra email hoặc gửi lại mã xác thực.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Tài khoản của bạn đang bị khóa hoặc không hoạt động.");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .storeId(user.getStore() == null ? null : user.getStore().getId())
                .storeName(user.getStore() == null ? null : user.getStore().getName())
                .tokenType("Bearer")
                .token(token)
                .build();
    }
}
