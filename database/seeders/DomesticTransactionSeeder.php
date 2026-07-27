<?php

namespace Database\Seeders;

use App\Models\DomesticTransaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DomesticTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'];
        $picNames = ['Budi Santoso', 'Ahmad Wijaya', 'Siti Nurhaliza', 'Rini Susanti', 'Hendra Kusuma'];
        $sessions = ['MORNING', 'AFTERNOON'];

        // Generate 40 sample transactions with unique (date, session) combinations
        $usedCombinations = [];
        $count = 0;

        while ($count < 40) {
            $date = Carbon::now()->subDays(rand(0, 30))->format('Y-m-d');
            $session = $sessions[array_rand($sessions)];
            $combination = "$date-$session";

            // Skip if this combination already used
            if (in_array($combination, $usedCombinations)) {
                continue;
            }

            $usedCombinations[] = $combination;
            $organicWeight = rand(20, 150);
            $inorganicWeight = rand(30, 200);

            DomesticTransaction::create([
                'date' => $date,
                'session' => $session,
                'organic_weight_kg' => $organicWeight,
                'inorganic_weight_kg' => $inorganicWeight,
                'total_weight_kg' => $organicWeight + $inorganicWeight,
                'status' => $statuses[array_rand($statuses)],
                'pic_name' => $picNames[array_rand($picNames)],
                'pic_phone' => '08' . rand(10000000000, 99999999999),
                'notes' => 'Domestic waste transaction ' . ($count + 1),
            ]);

            $count++;
        }
    }
}
