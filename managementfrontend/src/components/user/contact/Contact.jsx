import React, { useState } from "react";
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaClock, FaPaperPlane } from "react-icons/fa";
import { toast } from "react-toastify";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.message.trim()) {
      toast.warning("Vui lòng điền đầy đủ email và nội dung tin nhắn!");
      return;
    }

    setIsSubmitting(true);
    // Giả lập gửi tin nhắn liên hệ
    setTimeout(() => {
      toast.success("Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi sớm nhất.");
      setFormData({ email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <section className="contact-section" id="contact">
      <div className="main-content">
        <div className="contact-grid">
          {/* Cột trái: Thông tin liên hệ */}
          <div className="contact-info-panel">
            <h2 className="contact-heading title-font">
              Liên Hệ Với NexCoffee
            </h2>

            <p className="contact-lead">
              Bạn có câu hỏi về thực đơn, đặt bàn nhóm đông hoặc muốn hợp tác nhượng quyền? 
              Đừng ngần ngại liên hệ hoặc gửi lời nhắn trực tiếp cho chúng tôi.
            </p>

            <div className="contact-cards-list">
              <div className="contact-info-card">
                <div className="info-icon-box">
                  <FaMapMarkerAlt />
                </div>
                <div className="info-details">
                  <span className="info-label">Địa chỉ quán</span>
                  <p className="info-value">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="info-icon-box">
                  <FaEnvelope />
                </div>
                <div className="info-details">
                  <span className="info-label">Email hỗ trợ</span>
                  <a href="mailto:caphengon.125@gmail.com" className="info-value info-link">
                    caphengon.125@gmail.com
                  </a>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="info-icon-box">
                  <FaPhoneAlt />
                </div>
                <div className="info-details">
                  <span className="info-label">Hotline phục vụ</span>
                  <a href="tel:0333333333" className="info-value info-link">
                    0333 333 333
                  </a>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="info-icon-box">
                  <FaClock />
                </div>
                <div className="info-details">
                  <span className="info-label">Giờ phục vụ</span>
                  <p className="info-value">07:00 - 22:30 (Thứ 2 - Chủ Nhật)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form gửi tin nhắn trực tiếp */}
          <div className="contact-form-panel">
            <div className="form-card-container">
              <h3 className="form-heading">Gửi tin nhắn trực tiếp</h3>
              <p className="form-subheading">
                Chúng tôi sẽ phản hồi lại bạn qua email trong vòng 24 giờ làm việc.
              </p>

              <form onSubmit={handleSubmit} className="direct-contact-form" noValidate>
                <div className="form-group">
                  <label htmlFor="contact-email" className="input-label">Email của bạn *</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-subject" className="input-label">Chủ đề</label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Góp ý món mới, đặt bàn trước..."
                  />
                </div>

                <div className="form-group form-group-textarea">
                  <label htmlFor="contact-message" className="input-label">Nội dung tin nhắn *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Hãy chia sẻ chi tiết nội dung bạn cần hỗ trợ..."
                    rows="4"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit-contact"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? "Đang gửi..." : "Gửi Tin Nhắn"}</span>
                  <FaPaperPlane className="submit-icon" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
