<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\B3Transaction;
use App\Models\StorageAlert;
use App\Models\User;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacAndAlertsTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    /**
     * Test registration with role
     */
    public function test_user_registration_with_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Operator',
            'email' => 'operator@monowa.test',
            'password' => 'password123',
            'role' => 'OPERATOR_TPS',
            'department' => 'TPS Area 1',
            'phone' => '081234567890',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('user.role', 'OPERATOR_TPS');
        $response->assertJsonPath('user.department', 'TPS Area 1');
    }

    /**
     * Test admin can delete B3 transactions
     */
    public function test_admin_can_delete_b3_transaction(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN_EHS,
        ]);
        Sanctum::actingAs($admin);

        $category = WasteCategory::first() ?? WasteCategory::factory()->create();
        $tx = B3Transaction::create([
            'date' => now()->toDateString(),
            'transaction_type' => 'IN',
            'waste_category_id' => $category->id,
            'waste_code' => 'B101',
            'waste_name' => 'Oli Bekas',
            'weight_kg' => 150.5,
            'status' => 'PENDING',
        ]);

        $response = $this->deleteJson("/api/b3-transactions/{$tx->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('b3_transactions', ['id' => $tx->id]);
    }

    /**
     * Test operator cannot delete B3 transactions (403 Forbidden)
     */
    public function test_operator_cannot_delete_b3_transaction(): void
    {
        $operator = User::factory()->create([
            'role' => UserRole::OPERATOR_TPS,
        ]);
        Sanctum::actingAs($operator);

        $category = WasteCategory::first() ?? WasteCategory::factory()->create();
        $tx = B3Transaction::create([
            'date' => now()->toDateString(),
            'transaction_type' => 'IN',
            'waste_category_id' => $category->id,
            'waste_code' => 'B101',
            'waste_name' => 'Oli Bekas',
            'weight_kg' => 150.5,
            'status' => 'PENDING',
        ]);

        $response = $this->deleteJson("/api/b3-transactions/{$tx->id}");
        $response->assertStatus(403);

        $this->assertDatabaseHas('b3_transactions', ['id' => $tx->id]);
    }

    /**
     * Test acknowledging storage alert
     */
    public function test_acknowledge_storage_alert(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN_EHS,
        ]);
        Sanctum::actingAs($admin);

        $category = WasteCategory::first() ?? WasteCategory::factory()->create();
        $tx = B3Transaction::create([
            'date' => now()->subDays(10)->toDateString(),
            'transaction_type' => 'IN',
            'waste_category_id' => $category->id,
            'waste_code' => 'B101',
            'waste_name' => 'Limbah Medis',
            'weight_kg' => 50,
            'status' => 'PENDING',
            'storage_deadline_at' => now()->addDays(5),
        ]);

        $alert = StorageAlert::create([
            'b3_transaction_id' => $tx->id,
            'alert_type' => 'H-7',
            'deadline_at' => $tx->storage_deadline_at,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/dashboard/alerts/{$alert->id}/acknowledge", [
            'acknowledged_by' => 'Petugas EHS',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('storage_alerts', [
            'id' => $alert->id,
            'is_active' => false,
        ]);
    }
}
