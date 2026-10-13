# NexCoffee Management — Architectural Context & Long-Term Memory

> Tài liệu này tổng hợp toàn bộ kiến trúc hệ thống, công nghệ, luồng dữ liệu và trạng thái phát triển của dự án **NexCoffee Management**, đóng vai trò làm bộ nhớ ngữ cảnh dài hạn cho AI Agent và nhà phát triển.

---

## 1. Phân tích Tech Stack hiện tại

### 1.1 Backend (`managementsystem/`)
- **Runtime & Ngôn ngữ:** Java 25 (OpenJDK 25).
- **Core Framework:** Spring Boot 4.0.6 (`spring-boot-starter-parent: 4.0.6`).
  - `spring-boot-starter-webmvc`: Xây dựng RESTful API.
  - `spring-boot-starter-data-jpa`: Tương tác ORM/Hibernate.
  - `spring-boot-starter-validation`: Jakarta Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`).
  - `spring-boot-starter-security`: Spring Security 6.x.
  - `spring-boot-starter-mail`: Tích hợp gửi email kích hoạt qua Google SMTP (`smtp.gmail.com:587`).
- **Cơ sở dữ liệu:** MySQL 8.x.
  - Driver: `mysql-connector-j`.
  - Hibernate config: `ddl-auto=update`, `show-sql=true`, `format_sql=true`.
  - Database name: `nexcoffee_db`.
- **Bảo mật & Xác thực:**
  - JWT (`jjwt-api: 0.12.6`, `jjwt-impl`, `jjwt-jackson`).
  - Thời hạn token: 24 giờ (`86400000 ms`).
  - Mã hóa mật khẩu: `BCryptPasswordEncoder`.
- **Thư viện bổ trợ & Tích hợp:**
  - `Project Lombok`: Giảm boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`).
  - `Jackson Databind`: Chuyển đổi JSON.
  - `TrackAsia Map API`: `trackasia.api-key` xử lý tọa độ, khoảng cách và bản đồ địa lý.
- **Port hoạt động:** `8080`.

### 1.2 Frontend (`managementfrontend/`)
- **Runtime & Bundler:** Node.js, Vite 8.0.10.
- **Framework UI:** React 19.2.5 (`react`, `react-dom`).
- **Routing:** React Router v7.14.2 (`react-router-dom`).
- **HTTP Client:** Axios 1.15.2.
- **Giao diện & Tiện ích bổ trợ:**
  - Biểu đồ Dashboard: `recharts` (3.8.1).
  - Biểu tượng: `react-icons` (5.6.0).
  - Thông báo giao diện: `react-toastify` (11.1.0), `sweetalert2` (11.26.24).
  - In hóa đơn: `react-to-print` (3.3.0).
  - Bản đồ GIS: `trackasia-gl` (2.0.1).
- **Port hoạt động:** `5173` (được cấu hình CORS cho phép gọi sang backend 8080).

---

## 2. Kiến trúc thư mục & Luồng dữ liệu (Architecture & Data Flow)

### 2.1 Cấu trúc thư mục tổng thể
```text
NexCoffee-Management/
├── .agents/                        # Bộ công cụ Agentic Skills & Rules
│   ├── rules/rules.md              # Quy tắc coding & UI/UX principles
│   └── skills/                     # 127+ skills và UI-UX Pro Max
├── .antigravity/                   # Lưu trữ bộ nhớ dài hạn của Antigravity IDE
│   └── context.md                  # File ngữ cảnh kiến trúc này
├── managementsystem/               # BACKEND SPRING BOOT
│   └── src/main/java/com/nexcoffee/managementsystem/
│       ├── config/                 # SecurityConfig, WebConfig (CORS, upload), PasswordConfig
│       ├── controllers/            # 18 REST Controllers (Product, Order, Pos, Category, Auth, ...)
│       ├── dto/                    # Data Transfer Objects (request/response)
│       ├── entities/               # 15 JPA Entities (User, Product, Order, OrderDetail, Store, ...)
│       ├── enums/                  # Role, OrderStatus, PaymentStatus, ProductVariantStatus, ...
│       ├── exceptions/             # GlobalExceptionHandler, ResourceNotFoundException, ...
│       ├── repositories/           # Spring Data JPA Repositories
│       ├── security/               # JwtAuthenticationFilter
│       └── services/               # Nghiệp vụ phân tầng (OrderService, ProductService, ...)
└── managementfrontend/            # FRONTEND REACT + VITE
    └── src/
        ├── apis/                   # 23 files gọi API qua Axios
        ├── components/             # Reusable components (admin/dataTable, searchBox, dropDown, ...)
        ├── layouts/                # AdminLayout, UserLayout, UserAccountLayout
        ├── pages/
        │   ├── admin/              # POS, Dashboard, Products, Orders, Categories, Delivery, Stores
        │   └── user/               # Home, Menu, ProductDetail, Cart, Checkout, Auth, Orders
        ├── routes/                 # WebRouters.jsx, ProtectedRoute, BlockAdminRoute, GuestOnlyRoute
        └── utils/                  # Helper functions (removeAccents, ScrollToTop)
```

### 2.2 Luồng dữ liệu chính (Data Flow & Component Flow)
1. **Xác thực & Phân quyền (Authentication Flow):**
   - User gửi thông tin login qua `authApi.login({ email, password })`.
   - Backend xác thực, trả về JWT Token và User Info.
   - Frontend lưu `accessToken` và `currentUser` vào `sessionStorage` (hoặc `localStorage`).
   - `ProtectedRoute.jsx` kiểm tra quyền theo mảng `allowedRoles` (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER`) trước khi cho phép render page.
   - Mỗi request sau đó gửi kèm header: `Authorization: Bearer <token>`.

2. **Luồng nghiệp vụ Bán hàng tại quầy (POS Component Flow):**
   - **Mounting:** `Pos.jsx` gọi song song `posApi.getProducts()` và `posApi.getCategories()`.
   - **Lọc:** Sử dụng `useMemo` lọc sản phẩm theo `selectedCategoryId` và từ khóa `searchQuery`.
   - **Biến thể:** Sản phẩm nhiều size (S/M/L) hiển thị dạng nhóm capsule; size mặc định hiển thị nút thêm đơn.
   - **Giỏ hàng:** Quản lý state `cart` trên bộ nhớ component (thêm, bớt số lượng, xóa món).
   - **Checkout:** Lấy `staffId` từ `currentUser` trong `sessionStorage`, đóng gói payload `{ subtotal, discount, total, paymentMethod: 'CASH', staffId, items: [...] }`, gửi đến `posApi.createOrder(orderPayload)`.
   - **Database Update:** Backend trừ tồn kho/tính doanh thu, lưu `Order` và `OrderDetail`.

3. **Luồng Quản trị dữ liệu (Admin CRUD Flow):**
   - Component Page (ví dụ `Products.jsx`, `Categories.jsx`) -> Gọi API qua `*Api.js`.
   - Dữ liệu trả về truyền vào component `DataTable.jsx` để hiển thị, tìm kiếm không dấu (`removeAccents`), sắp xếp và phân trang.

---

## 3. Cơ chế giao tiếp Backend ⟷ Frontend (Chi tiết tại `managementfrontend/src/apis`)

### 3.1 Cấu hình kết nối & CORS
- **Origin Backend:** `http://localhost:8080/api`
- **Origin Frontend:** `http://localhost:5173`
- **CORS:** `WebConfig.java` và `SecurityConfig.java` cho phép origin `5173`, full methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`), cho phép `allowCredentials(true)` và header `*`.
- **Upload tĩnh:** File tải lên lưu tại thư mục `uploads/` trên server và ánh xạ ra URL tĩnh `http://localhost:8080/images/**`.

### 3.2 Hiện trạng 2 Instance Axios trong `src/apis`
Hiện tại frontend đang tồn tại **2 file cấu hình Axios**:

1. **`axiosClient.js` (Dùng cho phần lớn Admin & POS APIs):**
   - Tự động gắn token từ `sessionStorage` hoặc `localStorage` vào `config.headers.Authorization`.
   - **Không bóc tách response:** Trả về đối tượng `AxiosResponse` nguyên bản. Khi component gọi cần lấy qua `res.data`.
   - Đang được sử dụng bởi: `ProductApi.js`, `CategoryApi.js`, `OrderApi.js`, `DashboardApi.js`, `posApi.js`, `cartApi.js`, `storeApi.js`, `deliveryAreaApi.js`,...

2. **`axios.js` (Dùng cho một số public/auth APIs):**
   - Có interceptor bóc tách dữ liệu: `response.use(res => res.data)`. Component nhận trực tiếp payload dữ liệu.
   - **Chưa có request interceptor** tự động đính kèm `Bearer token`.
   - Đang được sử dụng bởi: `authApi.js`, `menuApi.js`, `publicStoreApi.js`, `searchApi.js`.

> **Khuyến nghị kiến trúc dài hạn:** Trong các đợt refactor tới, nên hợp nhất thành 1 instance duy nhất có cả tự động gắn Bearer Token và xử lý lỗi/bóc tách dữ liệu tập trung.

### 3.3 Định dạng Dữ liệu Payload & Response
- **Thành công (200 OK):**
  - Backend Spring Boot trả về trực tiếp DTO đối tượng (JSON object) hoặc List DTO (JSON array).
  - Không bọc trong cấu trúc vỏ `ApiResponse { code, message, data }` mà trả trực tiếp payload sạch:
    - Ví dụ `GET /api/categories` trả về: `[{ id: 1, name: "Cà phê", status: true }, ...]`
- **Upload File (Multipart/form-data):**
  - Frontend: Gửi qua `FormData` (`mainImage`, `subImages`, `deletedImageIds`, ...).
  - Header: `"Content-Type": "multipart/form-data"`.
  - Backend: Nhận qua `@ModelAttribute @Valid ProductRequest` kết hợp `@RequestParam MultipartFile`.
- **Xử lý lỗi (GlobalExceptionHandler):**
  - Lỗi 404: `ErrorResponse { status: 404, message: "...", timestamp: "..." }`.
  - Lỗi 400 Validation: `{ status: 400, message: "Lỗi kiểm tra dữ liệu đầu vào", errors: { field: "message" }, timestamp: "..." }`.
  - Lỗi 400 Logic: `InvalidOperationException` trả về `ErrorResponse`.

---

## 4. Đánh giá trạng thái dự án (Hoàn thành vs Dang dở)

### 4.1 Các tính năng ĐÃ HOÀN THÀNH (Done)
- [x] **Xác thực & Bảo mật (Auth & Security):** Đăng ký, đăng nhập, mã hóa BCrypt, JWT Filter, gửi mail kích hoạt tài khoản via SMTP, phân quyền 4 roles.
- [x] **Quản lý danh mục (Category Management):** CRUD, bật/tắt trạng thái hiển thị, xem chi tiết danh mục.
- [x] **Quản lý sản phẩm & Biến thể (Product & Variant Management):** Thêm/sửa sản phẩm kèm tải lên ảnh chính & nhiều ảnh phụ, quản lý giá theo biến thể Size (S, M, L), soft-delete đưa vào thùng rác (`trashed`).
- [x] **Bán hàng tại quầy (POS Core):** Tìm kiếm, lọc danh mục, thêm món theo size, giỏ hàng POS, tính tiền tự động, tạo đơn hàng gắn ID thu ngân đăng nhập.
- [x] **Bản đồ & Khu vực giao hàng (Delivery & Maps):** Tích hợp TrackAsia GL, phân chia khu vực giao hàng, quản lý danh sách tỉnh/thành/quận/huyện.
- [x] **Báo cáo thống kê (Dashboard & Daily Report):** Biểu đồ doanh thu theo ngày/tháng/năm với Recharts, thống kê món bán chạy nhất.
- [x] **Quảng cáo & Chi nhánh:** Quản lý banner quảng cáo trang chủ, quản trị danh sách cửa hàng chi nhánh.
- [x] **Portal Khách hàng & Trang chủ (`Home.jsx`):** Đã hoàn thiện thiết kế lại toàn diện trang chủ theo quy chuẩn `ui-ux-pro-max`, cấu trúc 6 sections so le tương phản (Dark `#1c1917` ↔ Light `#fffdf9`), hệ màu nhấn Crimson Red `#dc2626` / `#ef4444` / `#b91c1c`, nút khám phá menu tương tác 2 chiều và section Đánh giá khách hàng (Testimonials) với bộ lọc tương tác.
- [x] **Menu & Giỏ hàng cơ bản:** Menu sản phẩm, Giỏ hàng người dùng, Đổi mật khẩu.

### 4.2 Các tính năng CÒN DANG DỞ HOẶC CẦN NÂNG CẤP (In-Progress / Backlog)
- [ ] **Bảng dữ liệu `DataTable.jsx`:** Đang trong quá trình tối ưu lại logic sort/filter trong `useMemo`, ép cứng `tableLayout: fixed` và tooltip khi text bị tràn (`ellipsis`). Cần kiểm tra độ ổn định trên tất cả các trang Admin.
- [ ] **Thanh toán tại POS:** Hiện mới chỉ hỗ trợ `paymentMethod: "CASH"`. Chưa có tích hợp thanh toán chuyển khoản mã QR động (VietQR/VNPay) tại quầy.
- [ ] **In bill tại quầy POS:** Thư viện `react-to-print` đã được cài đặt nhưng chưa tích hợp component mẫu hóa đơn in tự động sau khi bấm thanh toán thành công trong `Pos.jsx`.
- [ ] **Quản lý ca làm việc (Shift Management):** Chưa có bảng quản lý ca làm việc, kiểm kê tiền mặt đầu ca/cuối ca cho thu ngân.
- [ ] **Đồng bộ Axios Client:** Chưa quy hoạch chung 1 file Axios thống nhất giữa `axiosClient.js` và `axios.js`.
- [ ] **Luồng Checkout của Khách hàng (`UserCheckout.jsx`):** Đang hoàn thiện phần tự động tính khoảng cách và phí ship dựa vào tọa độ vị trí nhận hàng từ bản đồ TrackAsia.

---

## 5. Tiến độ cập nhật giao diện Portal Người Dùng (Home.jsx Redesign & Theme Tokens)

### 5.1 Hệ thống Design Tokens (`src/index.css`)
- **Nền Tối (Dark Section):** `--bg-dark: #1c1917` (Dark Mocha), `--card-dark: #292524`, `--text-dark-primary: #faf5f0`.
- **Nền Sáng (Light Section):** `--bg-light: #fffdf9` (Warm Milk Cream), `--card-light: #ffffff`, `--text-light-primary: #292524`.
- **Hệ màu nhấn Đỏ (Crimson / Ruby Red):**
  - `--accent-primary: #dc2626` (Đỏ Crimson chủ đạo cho nút bấm và điểm nhấn chính).
  - `--accent-hover: #ef4444` (Đỏ Coral sáng cho hover states và gradient text).
  - `--accent-light: #b91c1c` (Đỏ Ruby đậm đạt tỉ lệ tương phản WCAG AAA > 7:1 trên nền sáng).
  - `--primary-orange: #ef4444` (Đồng bộ các thành phần nav hover, cart badge, search icon).

### 5.2 Bố cục 6 Sections so le tương phản trên `Home.jsx`
1. **Section 1 - Hero (`#hero`, Tối `#1c1917`):**
   - Tagline badge phát sáng nhấp nháy (`.badge-dot`).
   - Dòng chữ tiêu đề highlight *"Đánh thức mọi giác quan"* (`linear-gradient(135deg, #ef4444, #dc2626)`).
   - Nút đôi CTA (Nút chính nền đỏ glow ấm, nút phụ viền sáng outline).
   - Thống kê nổi bật (100% nguyên chất, 4.9⭐ đánh giá).
   - Vầng sáng backdrop (`.coffee-glow-backdrop`) ánh đỏ ấm và hiệu ứng ly cà phê trôi nổi nhẹ nhàng.
2. **Section 2 - Signature Brews (`#signature-brews`, Sáng `#fffdf9`):**
   - Grid 4 thức uống bán chạy nhất (Cà phê muối kem béo, Bạc xỉu sữa dừa, Cold brew cam quế, Trà đào cam sả).
   - Badge danh mục, sao đánh giá, giá tiền Ruby Red `#b91c1c`, nút "+ Đặt món".
   - Nút lớn *"Khám Phá Toàn Bộ Thực Đơn"*: Nền đỏ chữ trắng, khi hover đổi thành viền đỏ chữ đỏ nền trắng.
3. **Section 3 - About Storytelling (`#about`, Tối `#1c1917`):**
   - Câu chuyện thương hiệu *"Từ Nông Trại Đến Trái Tim"* (gradient đỏ).
   - Thẻ ảnh thủ công kèm huy hiệu *"8+ Năm Kinh Nghiệm"* (gradient đỏ đổ bóng).
   - 3 cam kết chất lượng (Hạt chọn lọc, Kỹ thuật pha chế, Không gian trải nghiệm).
   - Nút liên hệ nhanh nền đỏ `#dc2626` và cụm mạng xã hội.
4. **Section 4 - Store Locator & Dịch Vụ (`#stores`, Sáng `#fffdf9`):**
   - 3 trụ cột giá trị (Không gian làm việc, Trải nghiệm tại bàn, Giao hàng siêu tốc).
   - Banner *"Thưởng Thức Cà Phê Tại Nhà"* với nút đặt giao hàng nền đỏ Crimson.
5. **Section 5 - Contact (`#contact`, Tối `#1c1917`):**
   - 3 thẻ thông tin liên hệ trực tiếp (Hotline, Email, Cửa hàng trung tâm).
   - Form gửi tin nhắn nhanh với hiệu ứng viền sáng đỏ `#dc2626` khi focus ô nhập liệu.
   - Nút *"Gửi Tin Nhắn Ngay"* nền đỏ `#dc2626`, hover `#ef4444`.
6. **Section 6 - Testimonials (`#testimonials`, Sáng `#fffdf9`):**
   - Thanh bảo chứng xã hội (Social Proof Bar): 4.9/5 ⭐, 15.000+ khách hàng, 98.8% quay lại.
   - Bộ lọc đánh giá theo danh mục tương tác (*Tất cả*, *Cà phê pha phin*, *Cold brew*, *Không gian & Dịch vụ*).
   - Grid thẻ review chân thực kèm avatar, tích xanh xác thực, pill món ruột và trích dẫn cảm nhận.
   - Callout banner kêu gọi khách hàng gửi cảm nhận.

### 5.3 Đồng bộ Chân trang (Footer)
- Nền chuyển về `--bg-dark: #1c1917` (Dark Mocha) đồng bộ với toàn hệ thống.
- Tiêu đề các cột (`.footer .title`): Chuyển từ màu vàng cam `#d28737` sang đỏ Coral `var(--accent-hover, #ef4444)`.
- Hiệu ứng hover link và nhãn `<strong>`: Đồng bộ sang ánh đỏ ấm `#ef4444` và text-shadow đỏ.

### 5.4 Hiệu ứng chuyển tiếp mềm mại giữa các Section (`SectionDivider.jsx`)
- Sử dụng đường cong hữu cơ tự nhiên 2 tầng (Organic Double-Layer SVG Wave) mô phỏng dòng sữa cà phê / bọt kem latte art hòa quyện.
- Hai biến thể chuyển màu mượt mà:
  - `type="dark-to-light"`: Chuyển mềm từ nền tối sang sáng.
  - `type="light-to-dark"`: Chuyển mềm từ nền sáng sang tối (hỗ trợ `flip={true}` tạo độ đảo chiều sóng tự nhiên).
### 5.6 Hoàn thiện Section Liên Hệ (Contact Section)
- Bỏ badge "Kết Nối Với Chúng Tôi", căn chỉnh tiêu đề `margin-top: 0` ngang hàng với khung form bên phải.
- Cân bằng chiều cao hai cột (Equal Height Columns): Cột trái (Flex column chứa 4 thẻ liên hệ có `flex: 1`) và Cột phải (`.form-card-container` có `height: 100%`, form textarea có `flex: 1` dãn nở linh hoạt) đảm bảo mép dưới của cả 2 cột luôn chạm cùng một đường ngang hoàn hảo.

### 5.7 Trang Thực Đơn (Menu Page) - Skeleton Loading & Border Phân Cách
- **Skeleton Shimmer Loading:** Thay thế dòng text "Đang tải menu..." bằng animation sóng ánh sáng kem cà phê (`skeleton-shimmer`). Khớp 100% layout thực tế gồm tiêu đề nhóm, ảnh sản phẩm, dòng tên, dòng giá và nút giỏ hàng (Zero Cumulative Layout Shift).
- **Border phân cách Sidebar:** Bỏ khung viền hộp tròn độc lập (`border-radius: 1.6rem`, shadow). Thay bằng cột danh mục tự nhiên với `border-right: 1px solid rgba(57, 27, 9, 0.12)` kéo dài xuyên suốt trang. Danh mục chuyển sang dạng Modern List với chỉ báo `border-left: 3px solid #dc2626` khi active. Responsive chuyển sang `border-bottom` trên mobile/tablet.

### 5.8 Chuẩn hóa .gitignore & Bảo vệ File Nhạy Cảm (Git Hygiene)
- Cập nhật đồng bộ hệ thống `.gitignore` tại Root, Frontend và Backend:
  - **Secrets:** Chặn triệt để `application.properties` (chứa mail password, jwt secret, API key), các file `.env*`, keys, certificates. Cung cấp file mẫu [application.properties.example](file:///d:/HOC/NexCoffee-Management/managementsystem/src/main/resources/application.properties.example).
  - **Dependencies & Builds:** `node_modules/`, `target/`, `dist/`, `build/`, `*.jar`, `*.war`.
  - **Dynamic Uploads:** Chặn toàn bộ thư mục `uploads/` (file ảnh người dùng tải lên), chỉ lưu file `.gitkeep`.
  - **IDEs & OS:** `.idea/`, `.vscode/*`, `.DS_Store`, `Thumbs.db`, `logs/`, `*.log`.

---

## 6. Quy ước & Hướng dẫn dành cho AI Agent
1. **Trước khi thực hiện tác vụ lớn:** Luôn đọc lại file này và tham khảo quy tắc tại `.agents/rules/rules.md`.
2. **Khi thiết kế UI mới hoặc sửa giao diện:** Sử dụng tri thức từ skill `ui-ux-pro-max` (bảng màu, spacing, typography, responsive, a11y, không dùng emoji làm icon).
3. **Khi xử lý API & Backend:** Tuân thủ cấu trúc phân tầng Controller -> Service -> Repository. Trả về đúng format DTO mà frontend mong đợi.

