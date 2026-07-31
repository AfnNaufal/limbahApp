<?php

namespace App\Http\Controllers\Api;

use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController
{
    /**
     * Get all system settings as key-value map
     */
    public function index(): JsonResponse
    {
        $settings = SystemSetting::all()->pluck('value', 'key')->toArray();

        return response()->json([
            'status' => 'success',
            'data' => $settings,
        ]);
    }

    /**
     * Update system settings (key-value pairs)
     */
    public function update(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        foreach ($payload as $key => $value) {
            SystemSetting::set($key, is_array($value) ? json_encode($value) : (string) $value);
        }

        $allSettings = SystemSetting::all()->pluck('value', 'key')->toArray();

        return response()->json([
            'status' => 'success',
            'message' => 'Settings updated successfully',
            'data' => $allSettings,
        ]);
    }
}
