<?php

namespace App\Console\Commands;

use App\Models\B3Transaction;
use App\Models\Notification;
use App\Models\StorageAlert;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckB3StorageAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-b3-storage-alerts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa tenggat waktu penyimpanan limbah B3 dan buat alert otomatis jika mendekati deadline';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai pengecekan masa simpan limbah B3...');

        $now = Carbon::now();
        $transactions = B3Transaction::query()
            ->where(function ($q) {
                $q->where('transaction_type', 'IN')
                  ->orWhere('transaction_type', \App\Enums\WasteMovementType::IN);
            })
            ->whereNotNull('storage_deadline_at')
            ->where('status', '!=', 'COMPLETED')
            ->get();

        $alertsCreated = 0;

        foreach ($transactions as $tx) {
            $deadline = Carbon::parse($tx->storage_deadline_at);
            $daysLeft = $now->diffInDays($deadline, false);

            $alertType = null;
            $alertTitle = null;
            $alertMsg = null;

            if ($daysLeft < 0) {
                $alertType = 'EXPIRED';
                $alertTitle = 'Batas Simpan B3 Terlewat!';
                $daysOverdue = abs((int) $daysLeft);
                $alertMsg = "Limbah {$tx->waste_name} telah melebihi batas waktu penyimpanan ({$daysOverdue} hari lalu).";
            } elseif ($daysLeft <= 7) {
                $alertType = 'H-7';
                $alertTitle = 'Peringatan Kritis Masa Simpan B3';
                $alertMsg = "Limbah {$tx->waste_name} tersisa {$daysLeft} hari sebelum batas maksimal penyimpanan.";
            } elseif ($daysLeft <= 30) {
                $alertType = 'H-30';
                $alertTitle = 'Peringatan Masa Simpan B3';
                $alertMsg = "Limbah {$tx->waste_name} tersisa {$daysLeft} hari sebelum batas waktu simpan.";
            }

            if ($alertType !== null) {
                // Check if alert already active for this transaction and type
                $existingAlert = StorageAlert::where('b3_transaction_id', $tx->id)
                    ->where('alert_type', $alertType)
                    ->where('is_active', true)
                    ->first();

                if (!$existingAlert) {
                    DB::transaction(function () use ($tx, $alertType, $deadline, $alertTitle, $alertMsg, &$alertsCreated) {
                        StorageAlert::create([
                            'b3_transaction_id' => $tx->id,
                            'alert_type' => $alertType,
                            'deadline_at' => $deadline,
                            'is_active' => true,
                            'triggered_at' => now(),
                            'notes' => $alertMsg,
                        ]);

                        Notification::create([
                            'type' => 'alert',
                            'title' => $alertTitle,
                            'message' => $alertMsg,
                            'reference_type' => 'B3_STORAGE_ALERT',
                            'reference_id' => $tx->id,
                            'is_read' => false,
                        ]);

                        $alertsCreated++;
                    });
                }
            }
        }

        $this->info("Pengecekan selesai. {$alertsCreated} peringatan baru diterbitkan.");
        return Command::SUCCESS;
    }
}
