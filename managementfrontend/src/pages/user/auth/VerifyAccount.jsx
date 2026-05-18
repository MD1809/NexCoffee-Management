import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyToken } from "../../../apis/authApi";
import { toast } from "react-toastify";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const hasCalledVerify = useRef(false);

  useEffect(() => {
    if (hasCalledVerify.current) return;
    hasCalledVerify.current = true;

    const verify = async () => {
      if (!token) {
        toast.error("Liên kết xác thực không hợp lệ.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        await verifyToken(token);

        toast.success("Xác thực tài khoản thành công!");
        navigate("/login", { replace: true });
      } catch (error) {
        const serverError = error.response?.data || "";

        if (
          serverError.includes("hết hạn") ||
          serverError.toLowerCase().includes("expired")
        ) {
          toast.warning("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
          navigate("/resend-verification", { replace: true });
          return;
        }

        toast.error(serverError || "Liên kết xác thực không hợp lệ.");
        navigate("/login", { replace: true });
      }
    };

    verify();
  }, [token, navigate]);

  return null;
};

export default VerifyAccount;
