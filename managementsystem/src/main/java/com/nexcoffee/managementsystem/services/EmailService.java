package com.nexcoffee.managementsystem.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendOrderStatusEmail(String toEmail, String customerName, String orderCode, String status, String cancelReason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);

            helper.setSubject("Đơn hàng " + orderCode + " - NexCoffee");
            String mainContent = "";
            if ("Shipped".equalsIgnoreCase(status)) {
                mainContent = buildShippedContent(customerName, orderCode);
            } else if ("Completed".equalsIgnoreCase(status)) {
                mainContent = buildCompletedContent(customerName, orderCode);
            } else if ("Cancelled".equalsIgnoreCase(status)) {
                mainContent = buildCancelledContent(customerName, orderCode, cancelReason);
            } else {
                return;
            }

            String finalHtml = buildBaseTemplate(mainContent);
            helper.setText(finalHtml, true);

            mailSender.send(message);
            System.out.println("-> [Email] Đã gửi thông báo đơn hàng " + orderCode + " (" + status + ") thành công.");
        } catch (MessagingException e) {
            System.err.println("-> [Email Lỗi] Không thể gửi thư thông báo đơn hàng: " + e.getMessage());
        }
    }


    // Đang Giao
    private String buildShippedContent(String customerName, String orderCode) {
        return """
            <h2 style="margin:0 0 20px 0; color:#391b09; text-align:center; font-size:22px; font-weight:700;">
                ĐƠN HÀNG ĐANG ĐƯỢC GIAO
            </h2>
            <p style="margin:0 0 16px 0; font-size:16px;">Chào <strong>%s</strong>,</p>
            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#4f382a;">
                Đơn hàng có mã <strong>%s</strong> của bạn tại NexCoffee đang trên đường giao đến bạn.
            </p>
            <p style="margin:16px 0 0 0; font-size:15px; line-height:1.6; color:#4f382a;">
                Shipper của chúng tôi sẽ liên hệ với bạn trong ít phút nữa. Vui lòng chú ý điện thoại để nhận những ly cà phê chuẩn vị nhất nhé!
            </p>
            """.formatted(customerName, orderCode);
    }

    // Đã Giao Thành Công
    private String buildCompletedContent(String customerName, String orderCode) {
        return """
            <h2 style="margin:0 0 20px 0; color:#22c55e; text-align:center; font-size:22px; font-weight:700;">
                GIAO HÀNG THÀNH CÔNG
            </h2>
            <p style="margin:0 0 16px 0; font-size:16px;">Chào <strong>%s</strong>,</p>
            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#4f382a;">
                Đơn hàng <strong>%s</strong> của bạn đã được giao đến nơi thành công.
            </p>
            <p style="margin:16px 0 0 0; font-size:15px; line-height:1.6; color:#4f382a;">
                Cảm ơn bạn đã lựa chọn NexCoffee. Mong bạn có một trải nghiệm thưởng thức thật tuyệt vời. Hẹn gặp lại bạn trong những đơn hàng tiếp theo!
            </p>
            """.formatted(customerName, orderCode);
    }

    // 3. Mẫu Hủy Đơn
    private String buildCancelledContent(String customerName, String orderCode, String cancelReason) {
        String reasonHtml = (cancelReason != null && !cancelReason.trim().isEmpty())
                ? "<div style='margin:20px 0; padding:15px; background-color:#fee2e2; border-radius:6px; color:#b91c1c; font-size:15px;'><strong>Lý do hủy:</strong> " + cancelReason + "</div>"
                : "";

        return """
            <h2 style="margin:0 0 20px 0; color:#ef4444; text-align:center; font-size:22px; font-weight:700;">
                ĐƠN HÀNG ĐÃ BỊ HỦY
            </h2>
            <p style="margin:0 0 16px 0; font-size:16px;">Chào <strong>%s</strong>,</p>
            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#4f382a;">
                Chúng tôi rất tiếc phải thông báo rằng đơn hàng <strong>%s</strong> của bạn đã bị hủy.
            </p>
            %s
            <p style="margin:16px 0 0 0; font-size:15px; line-height:1.6; color:#4f382a;">
                Chúng tôi vô cùng xin lỗi vì sự bất tiện này và hy vọng được phục vụ bạn tốt hơn trong lần sau.
            </p>
            """.formatted(customerName, orderCode, reasonHtml);
    }

    private String buildBaseTemplate(String mainContent) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:0; background-color:#f4f0ec; font-family:'Google Sans', Roboto, Arial, sans-serif;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="width:100%%; background-color:#f4f0ec; padding:32px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%%; background-color:#ffffff; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.12);">
                                <tr>
                                    <td align="center" style="background-color:#391b09; padding:24px 20px;">
                                        <div style="font-size:26px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">
                                            NexCoffee
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:40px 36px 30px 36px; color:#3d2415;">
                                        %s
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:20px 30px 28px 30px; font-size:12px; color:#888888; border-top:1px solid #f4f0ec;">
                                        © 2026 NexCoffee. Hệ thống thông báo tự động.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(mainContent);
    }
}