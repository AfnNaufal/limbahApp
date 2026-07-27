<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class B3TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_type' => $this->transaction_type,
            'waste_category' => new WasteCategoryResource($this->wasteCategory),
            'waste_code' => $this->waste_code,
            'waste_name' => $this->waste_name,
            'date' => $this->date->format('Y-m-d'),
            'source' => $this->source,
            'destination' => $this->destination,
            'transporter' => $this->transporter,
            'manifest_number' => $this->manifest_number,
            'weight_kg' => (float) $this->weight_kg,
            'status' => $this->status,
            'storage_deadline_at' => $this->storage_deadline_at?->toIso8601String(),
            'is_near_deadline' => $this->is_near_deadline ?? false,
            'is_expired' => $this->is_expired ?? false,
            'notes' => $this->notes,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
