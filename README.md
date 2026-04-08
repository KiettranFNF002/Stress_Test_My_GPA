# STRESS TEST MY GPA

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Technology](https://img.shields.io/badge/Technology-Pure%20JS%2FHTML%2FCSS-blue)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Dashboard web tĩnh để phân tích bảng điểm, dự phóng GPA và lập kịch bản học tập cho sinh viên UEH (hoặc trường khác qua cấu hình mapping).

![Project Preview](screenshot.png)

## Mục tiêu dự án
- Nhập nhanh file Excel kết quả học tập.
- Tự động loại trừ các học phần không tính GPA.
- Mô phỏng kỳ học tiếp theo bằng các kịch bản điểm.
- Tính ngược GPA mục tiêu và gợi ý phương án đạt gần nhất.

## Hướng dẫn sử dụng
1. Tải source về máy rồi mở trực tiếp file `index.html` bằng Chrome/Edge.
2. Xuất file Excel từ UEH Student Portal:
   - Tra cứu thông tin -> Kết quả học tập -> Xuất Excel.
3. Kéo-thả file Excel vào dashboard.
4. Vào tab `Tất cả học phần` để chọn môn cải thiện (nếu cần).
5. Vào tab `Dự phóng` để nhập điểm mô phỏng theo hệ 10 hoặc hệ 4.
6. Dùng `Máy tính GPA mục tiêu` để tạo phân bổ tự động.

## Định dạng dữ liệu đầu vào
File Excel nên có các cột:
- `Mã học phần`
- `Tên học phần`
- `Số TC`
- `Điểm` (hệ 10; có thể để trống cho môn dự học)

## Ghi chú logic tính điểm
- GPA tích lũy gốc đi theo điểm hệ 10 và quy đổi sang hệ 4 theo mapping cấu hình.
- Các môn ngoại lệ (GDTC/GDQP/`(*)`) và điểm chữ đặc biệt (`M`, `P`, `I`, `X`) được xử lý riêng theo rule hệ thống.
- Ở mode mô phỏng hệ 4, một mức hệ 4 có thể tương ứng nhiều ngưỡng hệ 10. Vì vậy KPI GPA hệ 10 có thể hiển thị dạng khoảng ước tính.

## Cải tiến so với bản trước
- Sửa thứ tự khởi tạo dữ liệu/cấu hình để tránh tính GPA sai ở lần load đầu.
- Đồng bộ logic chart với logic GPA thực tế (loại đúng các học phần không tính GPA).
- Chặn và xử lý ổn định nhóm môn `M/P` trong luồng dự phóng.
- Sửa các lỗi hiển thị điểm `0` và lỗi tìm kiếm khi mã học phần không phải chuỗi.
- Cải tiến máy tính GPA mục tiêu hệ 4:
  - Quy đổi điểm theo các mức rời rạc trong mapping, không dùng giá trị lẻ không hợp lệ.
  - Áp dụng phân bổ theo từng môn thay vì ép đồng loạt một mức.
  - Tối ưu phân bổ theo hướng cân bằng hơn, giảm phương án cực đoan.
  - Hiển thị GPA thực tế khả thi gần nhất và trạng thái khả thi.
- Bảng `Học phần vừa cập nhật` phản ánh đầy đủ danh sách học phần thuộc diện dự phóng.
- Bổ sung nhãn KPI để phân biệt GPA hệ 10 thực tế, quy đổi và ước tính.

## Công nghệ sử dụng
- HTML5 / CSS3 (Vanilla)
- Vanilla JavaScript (ES6+)
- SheetJS (parse Excel client-side)
- Chart.js (trực quan hóa xu hướng)
- Lucide Icons
- html2canvas (xuất ảnh báo cáo)

## Triển khai GitHub Pages
1. Vào `Settings` -> `Pages`.
2. Chọn branch `main`, thư mục `/ (root)`.
3. Lưu cấu hình và chờ GitHub build trang.

## Giấy phép
MIT License.

Phát triển bởi [KiettranFNF002](https://github.com/KiettranFNF002)
