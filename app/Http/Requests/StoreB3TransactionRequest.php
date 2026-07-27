<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreB3TransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transaction_type' => 'required|in:IN,OUT',
            'waste_category_id' => 'required|exists:waste_categories,id',
            'waste_code' => 'required|string|max:50',
            'waste_name' => 'required|string|max:255',
            'date' => 'required|date|before_or_equal:today',
            'source' => 'required_if:transaction_type,IN|nullable|string|max:255',
            'destination' => 'required_if:transaction_type,OUT|nullable|string|max:255',
            'transporter' => 'nullable|string|max:255',
            'manifest_number' => 'nullable|string|max:100|unique:b3_transactions,manifest_number',
            'weight_kg' => 'required|numeric|min:0.01|max:999999.99',
            'status' => 'nullable|in:PENDING,RECEIVED,PROCESSED,COMPLETED,REJECTED',
            'storage_deadline_at' => 'nullable|date|after:date',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'transaction_type.required' => 'Transaction type is required (IN or OUT)',
            'transaction_type.in' => 'Transaction type must be either IN or OUT',
            'waste_category_id.required' => 'Waste category is required',
            'waste_category_id.exists' => 'Selected waste category does not exist',
            'date.required' => 'Transaction date is required',
            'date.before_or_equal' => 'Transaction date cannot be in the future',
            'source.required_if' => 'Source is required for incoming transactions',
            'destination.required_if' => 'Destination is required for outgoing transactions',
            'manifest_number.unique' => 'This manifest number has already been used',
            'weight_kg.required' => 'Weight is required',
            'weight_kg.min' => 'Weight must be greater than 0',
            'storage_deadline_at.after' => 'Storage deadline must be after the transaction date',
        ];
    }
}
