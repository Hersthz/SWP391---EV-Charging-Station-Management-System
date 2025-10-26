package com.pham.basis.evcharging.exception;

public class AppException {

    // 400 - Bad Request --Request sai, thiếu tham số, dữ liệu không hợp lệ
    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) {
            super(message);
        }
    }

    // 401 - Unauthorized --Chưa đăng nhập hoặc token hết hạn
    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }

    // 403 - Forbidden --Không đủ quyền truy cập
    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) {
            super(message);
        }
    }

    // 404 - Resource Not Found --Không tìm thấy dữ liệu trong DB
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    // 409 - Conflict --Logic trùng lặp, xung đột
    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }

    // 500 - Internal Server Error --Lỗi không xác định
    public static class InternalServerErrorException extends RuntimeException {
        public InternalServerErrorException(String message) {
            super(message);
        }
    }
}
