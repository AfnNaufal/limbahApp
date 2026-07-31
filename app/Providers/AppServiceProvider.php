<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Blade::directive('fonts', function () {
            return <<<HTML
                <link rel="preconnect" href="https://fonts.bunny.net">
                <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800|dm-sans:400,500,600,700,800|jetbrains-mono:400,500,600,700" rel="stylesheet" />
            HTML;
        });
    }
}