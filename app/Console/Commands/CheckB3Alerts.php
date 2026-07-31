<?php

namespace App\Console\Commands;

use App\Services\B3TransactionService;
use Illuminate\Console\Command;

class CheckB3Alerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'limbah:check-alerts {--days=7 : Days before deadline to trigger warning}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and generate storage alert notifications for B3 transactions approaching deadline';

    /**
     * Execute the console command.
     */
    public function handle(B3TransactionService $service): int
    {
        $days = (int) $this->option('days');
        $this->info("Checking B3 waste storage deadlines (threshold: {$days} days)...");

        $alertsCreated = $service->checkAndCreateStorageAlerts($days);

        $this->info("Completed. {$alertsCreated} new storage alert(s) generated.");

        return Command::SUCCESS;
    }
}
