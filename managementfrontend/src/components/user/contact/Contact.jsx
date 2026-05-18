import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <section className="contact-section" id="contact">
      <div className="main-content">
        <div className="body">
          <div className="contact-info">
            <h3 className="contact-title title-font">Liên Hệ Với Chúng Tôi</h3>
            <p className="contact-desc">
              Nếu bạn có bất kỳ câu hỏi hay góp ý nào, đừng ngần ngại liên hệ
              với chúng tôi qua thông tin bên dưới hoặc gửi tin nhắn trực tiếp.
            </p>

            <p className="info-item">
              <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP. Hồ Chí Minh
            </p>
            <p className="info-item">
              <strong>Email:</strong> caphengon.125@gmail.com
            </p>
            <p className="info-item">
              <strong>Hotline:</strong> 03333333333
            </p>
            <p className="info-item">
              <strong>Giờ mở cửa:</strong> 7:00 - 22:00 (Thứ 2 - Chủ Nhật)
            </p>
          </div>

          <div className="contact-form">
            <h4 className="form-title">Gửi tin nhắn trực tiếp cho chúng tôi</h4>

            <form id="contact-form" noValidate>
              <input
                type="email"
                name="email"
                placeholder="Email của bạn. (chúng tôi sẽ liên hệ với bạn qua email này !)"
                required
              />
              <input type="text" name="subject" placeholder="Chủ đề" />
              <textarea
                name="message"
                placeholder="Nội dung"
                rows="4"
                required
              ></textarea>
              <button type="button" className="btn-submit">
                Gửi
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
