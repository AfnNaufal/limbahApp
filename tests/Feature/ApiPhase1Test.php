<?php

namespace Tests\Feature;

use App\Models\B3Transaction;
use App\Models\DomesticTransaction;
use App\Models\WasteCategory;
use Tests\TestCase;

class ApiPhase1Test extends TestCase
{
    /**
     * Test waste categories endpoint
     */
    public function test_get_waste_categories()
    {
        $response = $this->getJson('/api/waste-categories');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name', 'waste_type']
            ]
        ]);
    }

    /**
     * Test B3 transactions index
     */
    public function test_get_b3_transactions()
    {
        $response = $this->getJson('/api/b3-transactions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id', 'transaction_type', 'waste_code', 'waste_name',
                    'date', 'weight_kg', 'status'
                ]
            ]
        ]);
    }

    /**
     * Test B3 transactions filter by type
     */
    public function test_get_b3_transactions_filter_by_type()
    {
        $response = $this->getJson('/api/b3-transactions?type=IN');

        $response->assertStatus(200);

        // All returned transactions should be type IN
        foreach ($response->json('data') as $transaction) {
            $this->assertEquals('IN', $transaction['transaction_type']);
        }
    }

    /**
     * Test create B3 transaction
     */
    public function test_create_b3_transaction()
    {
        $category = WasteCategory::first();

        $payload = [
            'transaction_type' => 'IN',
            'waste_category_id' => $category->id,
            'waste_code' => $category->code,
            'waste_name' => $category->name,
            'date' => today()->toDateString(),
            'source' => 'Test Source',
            'weight_kg' => 100.50,
            'status' => 'PENDING',
        ];

        $response = $this->postJson('/api/b3-transactions', $payload);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => ['id', 'transaction_type', 'waste_code', 'date', 'weight_kg']
        ]);
    }

    /**
     * Test get single B3 transaction
     */
    public function test_get_single_b3_transaction()
    {
        $transaction = B3Transaction::first();

        $response = $this->getJson("/api/b3-transactions/{$transaction->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $transaction->id);
    }

    /**
     * Test update B3 transaction
     */
    public function test_update_b3_transaction()
    {
        $transaction = B3Transaction::first();

        $payload = ['status' => 'COMPLETED'];

        $response = $this->putJson("/api/b3-transactions/{$transaction->id}", $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'COMPLETED');
    }

    /**
     * Test delete B3 transaction
     */
    public function test_delete_b3_transaction()
    {
        $transaction = B3Transaction::factory()->create();
        $transactionId = $transaction->id;

        $response = $this->deleteJson("/api/b3-transactions/{$transactionId}");

        $response->assertStatus(204);
    }

    /**
     * Test domestic transactions index
     */
    public function test_get_domestic_transactions()
    {
        $response = $this->getJson('/api/domestic-transactions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'date', 'session', 'total_weight_kg', 'status']
            ]
        ]);
    }

    /**
     * Test create domestic transaction
     */
    public function test_create_domestic_transaction()
    {
        $payload = [
            'date' => today()->toDateString(),
            'session' => 'MORNING',
            'organic_weight_kg' => 50.0,
            'inorganic_weight_kg' => 75.0,
            'status' => 'SUBMITTED',
            'pic_name' => 'Test PIC',
        ];

        $response = $this->postJson('/api/domestic-transactions', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.total_weight_kg', 125.0);
    }

    /**
     * Test dashboard summary endpoint
     */
    public function test_get_dashboard_summary()
    {
        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'b3_total_weight_kg',
                'b3_count_in',
                'b3_count_out',
                'domestic_today_organic_kg',
                'domestic_today_inorganic_kg',
                'storage_alerts_active',
                'notifications_unread',
                'recent_b3_transactions',
                'recent_domestic_transactions',
                'recent_alerts',
            ]
        ]);
    }

    /**
     * Test dashboard alerts endpoint
     */
    public function test_get_dashboard_alerts()
    {
        $response = $this->getJson('/api/dashboard/alerts');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'alert_type', 'deadline_at', 'is_active']
            ]
        ]);
    }

    /**
     * Test health check endpoint
     */
    public function test_dashboard_health()
    {
        $response = $this->getJson('/api/dashboard/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status', 'expired_alerts', 'near_deadline_count', 'last_checked'
        ]);
    }

    /**
     * Test notifications endpoint
     */
    public function test_get_notifications()
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'type', 'title', 'message', 'is_read']
            ]
        ]);
    }

    /**
     * Test health check endpoint
     */
    public function test_health_check()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'timestamp']);
    }

    /**
     * Test invalid route returns 404
     */
    public function test_invalid_route_returns_404()
    {
        $response = $this->getJson('/api/invalid-endpoint');

        $response->assertStatus(404);
    }
}
