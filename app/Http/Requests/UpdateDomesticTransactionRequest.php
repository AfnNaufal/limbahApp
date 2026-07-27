<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDomesticTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $transactionId = $this->route('domestic_transaction')?->id ?? $this->route('domestic_transaction');

        return [
            'date' => 'sometimes|date|before_or_equal:today',
            'session' => 'sometimes|in:MORNING,AFTERNOON|unique:domestic_transactions,session,NULL,id,date,' . $this->input('date'),
            'organic_weight_kg' => 'sometimes|numeric|min:0|max:999999.99',
            'inorganic_weight_kg' => 'sometimes|numeric|min:0|max:999999.99',
            'status' => 'sometimes|in:DRAFT,SUBMITTED,VERIFIED,REJECTED',
            'pic_name' => 'sometimes|string|max:255',
            'pic_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'session.in' => 'Session must be either MORNING or AFTERNOON',
            'session.unique' => 'A transaction for this date and session already exists',
            'organic_weight_kg.min' => 'Organic weight cannot be negative',
            'inorganic_weight_kg.min' => 'Inorganic weight cannot be negative',
        ];
    }
}
