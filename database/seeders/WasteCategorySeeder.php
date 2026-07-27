<?php

namespace Database\Seeders;

use App\Models\WasteCategory;
use Illuminate\Database\Seeder;

class WasteCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            // B3 Categories
            ['code' => 'B3001', 'name' => 'Limbah B3 - Limbah Cair', 'description' => 'Limbah cair B3', 'waste_type' => 'B3'],
            ['code' => 'B3002', 'name' => 'Limbah B3 - Limbah Padat', 'description' => 'Limbah padat B3', 'waste_type' => 'B3'],
            ['code' => 'B3003', 'name' => 'Limbah B3 - Tinta & Cat', 'description' => 'Limbah tinta dan cat', 'waste_type' => 'B3'],
            ['code' => 'B3004', 'name' => 'Limbah B3 - Pelarut Organik', 'description' => 'Limbah pelarut organik berbahaya', 'waste_type' => 'B3'],
            ['code' => 'B3005', 'name' => 'Limbah B3 - Minyak Bekas', 'description' => 'Minyak bekas mesin dan industri', 'waste_type' => 'B3'],
            ['code' => 'B3006', 'name' => 'Limbah B3 - Asam & Basa', 'description' => 'Limbah asam dan basa korositif', 'waste_type' => 'B3'],
            ['code' => 'B3007', 'name' => 'Limbah B3 - Baterai', 'description' => 'Limbah baterai beracun', 'waste_type' => 'B3'],
            ['code' => 'B3008', 'name' => 'Limbah B3 - Wadah Bekas', 'description' => 'Wadah bekas berisi bahan B3', 'waste_type' => 'B3'],
            ['code' => 'B3009', 'name' => 'Limbah B3 - Abu Hasil Pembakaran', 'description' => 'Abu dari pembakaran limbah', 'waste_type' => 'B3'],
            ['code' => 'B3010', 'name' => 'Limbah B3 - Debu Logam', 'description' => 'Debu logam berat', 'waste_type' => 'B3'],

            // DOMESTIC Categories
            ['code' => 'DOM001', 'name' => 'Sampah Organik', 'description' => 'Sampah organik dapat terurai', 'waste_type' => 'DOMESTIC'],
            ['code' => 'DOM002', 'name' => 'Sampah Anorganik', 'description' => 'Sampah anorganik sulit terurai', 'waste_type' => 'DOMESTIC'],
            ['code' => 'DOM003', 'name' => 'Kertas & Kardus', 'description' => 'Sampah kertas dan kardus bekas', 'waste_type' => 'DOMESTIC'],
            ['code' => 'DOM004', 'name' => 'Plastik', 'description' => 'Sampah plastik berbagai jenis', 'waste_type' => 'DOMESTIC'],
            ['code' => 'DOM005', 'name' => 'Logam & Kaleng', 'description' => 'Sampah logam dan kaleng bekas', 'waste_type' => 'DOMESTIC'],
            ['code' => 'DOM006', 'name' => 'Kaca & Keramik', 'description' => 'Sampah kaca dan keramik pecah', 'waste_type' => 'DOMESTIC'],
        ];

        foreach ($categories as $category) {
            WasteCategory::firstOrCreate(['code' => $category['code']], $category);
        }
    }
}
