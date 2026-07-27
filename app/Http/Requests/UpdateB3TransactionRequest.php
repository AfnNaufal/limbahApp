<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateB3TransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $transactionId = $this->route('b3_transaction')?->id ?? $this->route('b3_transaction');

        return [
            'transaction_type' => 'sometimes|in:IN,OUT',
            'waste_category_id' => 'sometimes|exists:waste_categories,id',
            'waste_code' => 'sometimes|string|max:50',
            'waste_name' => 'sometimes|string|max:255',
            'date' => 'sometimes|date|before_or_equal:today',
            'source' => 'nullable|string|max:255',
            'destination' => 'nullable|string|max:255',
            'transporter' => 'nullable|string|max:255',
            'manifest_number' => 'nullable|string|max:100|unique:b3_transactions,manifest_number,' . $transactionId,
            'weight_kg' => 'sometimes|numeric|min:0.01|max:999999.99',
            'status' => 'sometimes|in:PENDING,RECEIVED,PROCESSED,COMPLETED,REJECTED',
            'storage_deadline_at' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'transaction_type.in' => 'Transaction type must be either IN or OUT',
            'waste_category_id.exists' => 'Selected waste category does not exist',
            'date.before_or_equal' => 'Transaction date cannot be in the future',
            'manifest_number.unique' => 'This manifest number has already been used',
            'weight_kg.min' => 'Weight must be greater than 0',
        ];
    }
}
