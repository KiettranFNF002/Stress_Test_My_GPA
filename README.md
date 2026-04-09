# 📊 STRESS TEST MY GPA 🚀

> **Đừng để GPA làm bạn Stress, hãy Stress Test lại nó!**

👉 **TRẢI NGHIỆM NGAY TẠI: [https://kiettranfnf002.github.io/Stress_Test_My_GPA/](https://kiettranfnf002.github.io/Stress_Test_My_GPA/)**

---

Bản điều khiển (Dashboard) phân tích điểm số đỉnh cao dành cho sinh viên, giúp bạn làm chủ lộ trình học tập, dự phòng tương lai và chinh phục mục tiêu GPA một cách thông minh nhất.

![Dashboard Preview](screenshot.png)

---

## ✨ Tại sao bạn cần STRESS TEST MY GPA?

Việc tính điểm tích lũy (GPA) và lên kế hoạch học tập thường rất đau đầu:
- **Ngại tính toán**: Phải tự tay nhập từng môn vào Excel.
- **Rối rắm**: Không biết môn nào được tính, môn nào ngoại lệ (GDTC, GDQP...).
- **Mơ hồ**: Muốn đạt GPA 3.6 thì mấy môn tới phải được bao nhiêu điểm?
- **Sợ sai**: Công thức tính GPA hệ 10 và hệ 4 dễ gây nhầm lẫn.

**STRESS TEST MY GPA** ra đời để giải quyết tất cả những điều đó chỉ trong **1 nốt nhạc**! 🎶

---

## 🚀 Tính năng nổi bật

### 📸 Xuất báo cáo cực nét
Chỉ với 1 click, bạn có ngay file ảnh PNG báo cáo GPA chuyên nghiệp để khoe bạn bè hoặc lưu lại làm mục tiêu phấn đấu.

### 🔮 Máy tính GPA Mục tiêu (Inverse Forecasting)
Bạn nhập con số mong muốn (VD: 3.2), hệ thống sẽ **phân bổ rời rạc** mức điểm cần đạt cho từng môn dựa trên bảng Mapping (A, B, C...). 
*Lưu ý: Do đặc thù các mức điểm quy đổi là cố định, kết quả GPA thực tế đạt được có thể lệch một sai số cực nhỏ so với mục tiêu lý tưởng.*


### 🎯 Đồng bộ hệ điểm 10 & 4
Hệ thống sử dụng **Điểm hệ 10 làm nguồn dữ liệu gốc**. Điểm hệ 4 và Xếp loại được quy đổi động dựa trên cấu hình Mapping. Bạn có thể mô phỏng kịch bản ở cả hai hệ điểm một cách dễ dàng.

### 🛡️ Xử lý môn đặc biệt thông minh
Tự động nhận diện và loại bỏ các môn Ngoại lệ, môn đạt (M/P) để đảm bảo số liệu GPA của bạn luôn chính xác theo bộ quy tắc (rule) cấu hình hiện tại.

---

## 📥 Yêu cầu dữ liệu đầu vào

Để Dashboard hoạt động chuẩn xác, tệp Excel của bạn cần có các cột sau:

| Tên cột bắt buộc | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| **Mã học phần** | Văn bản/Số | Định danh duy nhất của môn học. |
| **Tên học phần** | Văn bản | Tên môn (dùng để nhận diện môn ngoại lệ). |
| **Số TC** | Số | Số tín chỉ của môn học. |
| **Điểm** | Số (Hệ 10) | Điểm số hiện tại (Để trống cho môn dự kiến). |

> [!TIP]
> **Dành cho sinh viên UEH:** Bạn chỉ cần vào Portal -> Kết quả học tập -> Nhấn **Xuất Excel**. File tải về đã khớp hoàn toàn với yêu cầu của hệ thống!

---

## ⚠️ Lưu ý quan trọng

- **Quyền riêng tư**: Mọi dữ liệu của bạn chỉ được lưu trữ tại thiết bị hiện tại (**localStorage**). Chúng tôi không lưu giữ bất kỳ thông tin nào của bạn trên server.
- **Tính bền vững**: Nếu bạn đổi trình duyệt, dùng trình ẩn danh hoặc xóa cache, dữ liệu học tập sẽ biến mất. Hãy dùng nút Reset nếu muốn làm mới bảng điểm.
- **Học lại / Học cải thiện**: Nếu một học phần xuất hiện nhiều lần trong file (kể cả trường hợp rớt nhiều lần), hệ thống sẽ tự gộp bản ghi trùng và ưu tiên lần có điểm tốt hơn để tránh nhân đôi tín chỉ/GPA.
- **Đổi tên học phần hoặc mã học phần**: Nếu trường đổi mã hoặc đổi tên môn qua từng khóa/kỳ, thuật toán hiện tại không thể tự suy luận 100% là cùng một môn. Bạn nên rà lại file Excel trước khi nạp để tránh sai lệch.
- **Online vs Offline**: 
    - **Dùng Online (Khuyên dùng)**: Luôn cập nhật tính năng mới nhất tại URL GitHub Pages.
    - **Dùng Offline**: Tải mã nguồn về máy nếu bạn muốn tùy chỉnh sâu hoặc dùng khi không có mạng.

---

## 📝 Hướng dẫn sử dụng cho người mới (Non-tech)

### Cách 1: Sử dụng Offline
1. Nhấn nút xanh **[<> Code]** phía trên -> Chọn **Download ZIP**.
2. Giải nén tệp vừa tải về.
3. Click đúp vào file `index.html` để mở trang web.

### Cách 2: Sử dụng trực tiếp Online
Chỉ cần truy cập đường link: [https://kiettranfnf002.github.io/Stress_Test_My_GPA/](https://kiettranfnf002.github.io/Stress_Test_My_GPA/)

---

## 🙌 Đóng góp

Dự án phát triển bởi **[KiettranFNF002](https://github.com/KiettranFNF002)**. Cảm ơn contributor **N.T.P** đã giúp phát hiện edge case học lại/học cải thiện học phần. Mọi ý tưởng đóng góp hoặc báo lỗi, vui lòng tạo **Issue** hoặc **Pull Request** nhé!

---

## ⚖️ Giấy phép

Dự án này được phát hành dưới [Giấy phép MIT](LICENSE).

---
⭐ **Nếu dự án này giúp bạn bớt Stress, hãy tặng mình 1 Star nhé!** ⭐
