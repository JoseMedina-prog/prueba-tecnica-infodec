<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Refresca clima y tasas guardados cada hora. Es opcional: si el programador (schedule:work / cron)
// no corre, la caché y el respaldo de ClimaService y MonedaService funcionan igual.
Schedule::command('externos:actualizar')->hourly()->withoutOverlapping();
