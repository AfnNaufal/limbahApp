<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDomesticTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date|before_or_equal:today',
            'session' => 'required|in:MORNING,AFTERNOON|unique:domestic_transactions,session,NULL,id,date,' . $this->input('date'),
            'organic_weight_kg' => 'required|numeric|min:0|max:999999.99',
            'inorganic_weight_kg' => 'required|numeric|min:0|max:999999.99',
            'status' => 'required|in:DRAFT,SUBMITTED,VERIFIED,REJECTED',
            'pic_name' => 'required|string|max:255',
            'pic_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'Date is required',
            'session.required' => 'Session is required (MORNING or AFTERNOON)',
            'session.in' => 'Session must be either MORNING or AFTERNOON',
            'session.unique' => 'A transaction for this date and session already exists',
            'organic_weight_kg.required' => 'Organic weight is required',
            'organic_weight_kg.min' => 'Organic weight cannot be negative',
            'inorganic_weight_kg.required' => 'Inorganic weight is required',
            'inorganic_weight_kg.min' => 'Inorganic weight cannot be negative',
            'status.required' => 'Status is required',
            'pic_name.required' => 'Person in charge name is required',
        ];
    }
}
