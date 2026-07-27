<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class DomesticTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'date',
        'session',
        'organic_weight_kg',
        'inorganic_weight_kg',
        'total_weight_kg',
        'status',
        'pic_name',
        'pic_phone',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'session' => 'string',
        'status' => 'string',
        'organic_weight_kg' => 'decimal:2',
        'inorganic_weight_kg' => 'decimal:2',
        'total_weight_kg' => 'decimal:2',
    ];

    /**
     * Boot the model - auto-calculate total weight
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            $model->total_weight_kg = $model->organic_weight_kg + $model->inorganic_weight_kg;
        });
    }

    /**
     * Scope: Filter by session
     */
    public function scopeBySession(Builder $query, string $session)
    {
        return $query->where('session', $session);
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus(Builder $query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeByDateRange(Builder $query, Carbon $from, Carbon $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    /**
     * Scope: Get today's transactions
     */
    public function scopeToday(Builder $query)
    {
        return $query->whereDate('date', today());
    }

    /**
     * Mutator: Auto-calculate total weight when setting organic/inorganic
     */
    public function setTotalWeightKgAttribute($value)
    {
        $this->attributes['total_weight_kg'] = $this->organic_weight_kg + $this->inorganic_weight_kg;
    }
}
