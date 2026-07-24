# Limbah App - Monitoring Limbah EHS

Sistem pemantauan limbah fasilitas B3 dan domestik dengan dashboard real-time yang dibangun menggunakan **Laravel 13 + React 19 + Tailwind CSS**.

## 📋 Requirement

- **PHP** 8.2 atau lebih tinggi
- **Node.js** 18 atau lebih tinggi
- **npm** 9 atau lebih tinggi
- **Composer** 2.0 atau lebih tinggi
- **Database**: MySQL 8.0 atau PostgreSQL 13+
- **Git**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd limbahApp
```

### 2. Install Dependencies

#### Backend (Laravel + PHP)
```bash
composer install
```

#### Frontend (Node.js)
```bash
npm install
```

### 3. Setup Environment

Buat file `.env`:
```bash
cp .env.example .env
```

Generate application key:
```bash
php artisan key:generate
```

Update konfigurasi di `.env` (yang penting):
```env
APP_NAME="Limbah App"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=limbahapp
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Setup Database

Buat database:
```bash
# MySQL
mysql -u root -e "CREATE DATABASE limbahapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Jalankan migrations:
```bash
php artisan migrate
```

### 5. Jalankan Aplikasi

**Terminal 1 - Vite Dev Server (Hot Reload):**
```bash
npm run dev
```

**Terminal 2 - Laravel Server:**
```bash
php artisan serve
```

Buka browser: **http://localhost:8000**

## 📁 Project Structure

```
limbahApp/
├── resources/
│   ├── css/                 # Tailwind styles
│   ├── js/                  # Laravel entry point (React)
│   ├── views/               # Blade templates (minimal)
│   └── frontend/            # React application
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── context.tsx  # State management
│       │   ├── theme.ts     # Theme configuration
│       │   ├── i18n.ts      # Internationalization
│       │   └── main.tsx     # React entry
│       └── package.json
├── app/                     # Laravel application code
├── routes/                  # Web routes
├── public/build/            # Compiled assets (Vite output)
├── vite.config.js           # Vite + Laravel configuration
├── package.json             # Node dependencies
└── composer.json            # PHP dependencies
```

## 🔧 Development Commands

### Frontend (React + Vite)
```bash
npm run dev       # Run with hot reload
npm run build     # Production build
npm run format    # Format code
```

### Backend (Laravel)
```bash
php artisan migrate              # Run migrations
php artisan serve                # Start dev server
php artisan tinker               # Laravel REPL
php artisan test                 # Run tests
```

## ⚙️ Environment Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `APP_NAME` | Limbah App | Nama aplikasi |
| `APP_ENV` | local | Environment |
| `APP_DEBUG` | true | Debug mode |
| `APP_URL` | http://localhost:8000 | Base URL |
| `DB_CONNECTION` | mysql | Database type |
| `DB_HOST` | 127.0.0.1 | Database host |
| `DB_PORT` | 3306 | Database port |
| `DB_DATABASE` | limbahapp | Database name |
| `DB_USERNAME` | root | Database user |
| `DB_PASSWORD` | | Database password |

## 🐛 Troubleshooting

### Layar Blank saat Diakses

**Penyebab**: Vite dev server belum running atau assets belum di-compile

**Solusi**:
1. Pastikan Vite running di Terminal 1: `npm run dev`
2. Pastikan Laravel running di Terminal 2: `php artisan serve`
3. Clear cache Laravel:
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan view:clear
   ```
4. Buka browser console (F12) dan cek error messages

### Node Module Issues
```bash
rm -rf node_modules package-lock.yaml
npm install
```

### Composer Issues
```bash
composer update
composer clear-cache
```

### Database Connection Error

1. Pastikan MySQL running
2. Verify `.env` credentials
3. Refresh migrations:
   ```bash
   php artisan migrate:refresh
   ```

### Asset tidak Loading

```bash
# Production build
npm run build

# Development rebuild
npm run dev
```

### Permission Denied

```bash
chmod -R 755 storage bootstrap/cache
```

## 📦 Production Deployment

### Build Frontend
```bash
npm run build
```

### Install Composer (Production)
```bash
composer install --no-dev --optimize-autoloader
```

### Optimize Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### Database Migration
```bash
php artisan migrate --force
```

## 🎨 Features

- ✅ Multi-theme support (Corporate, Frosted, Liquid, Flat, High Contrast, Night City)
- ✅ Light/Dark/AMOLED mode
- ✅ Real-time dashboard dengan charts
- ✅ B3 Waste monitoring & tracking
- ✅ Domestic waste management
- ✅ Notification system
- ✅ User settings & personalization
- ✅ Fully responsive design
- ✅ Multi-language support (ID, AR)
- ✅ Dark mode optimization

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Laravel | 13 |
| PHP | PHP | 8.2+ |
| Frontend | React | 19 |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS | 4 |
| Build | Vite | 8 |
| Charts | Recharts | 3.10 |
| Database | MySQL/PostgreSQL | 8.0+ |

## 📝 Notes

- Aplikasi mengintegrasikan React sebagai frontend framework utama
- Laravel digunakan sebagai API & asset server
- Semua styling menggunakan Tailwind CSS
- Hot reload tersedia untuk development melalui Vite
- Database menggunakan Laravel migrations

## 👥 Contributing

1. Create feature branch: `git checkout -b feature/YourFeature`
2. Commit changes: `git commit -m 'Add YourFeature'`
3. Push to branch: `git push origin feature/YourFeature`
4. Open Pull Request

## 📄 License

Proprietary - EHS Division

## 📞 Support

Untuk bantuan atau pertanyaan, hubungi team lead atau buka issue di repository.

---

**Last Updated**: 2026-07-24  
**Status**: Development

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
