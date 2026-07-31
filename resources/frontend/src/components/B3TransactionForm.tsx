import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import {
    Field,
    FormActions,
    FormCard,
    FormPage,
    Grid,
    Message,
    useInputStyle,
} from './formUI';

type TransactionType = 'IN' | 'OUT';

type MessageType = 'success' | 'error' | 'info';

type Category = {
    id: number;
    code: string;
    name: string;
    waste_type?: string;
};

type FormState = {
    date: string;
    waste_category_id: string;
    waste_code: string;
    waste_name: string;
    source: string;
    destination: string;
    transporter: string;
    manifest_number: string;
    weight_kg: string;
    storage_deadline_at: string;
    status: string;
    notes: string;
    scale_photo: File | null;
};

type B3TransactionPayload = {
    transaction_type: TransactionType;
    waste_category_id: number;
    waste_code: string;
    waste_name: string;
    date: string;
    source: string | null;
    destination: string | null;
    transporter: string | null;
    manifest_number: string | null;
    weight_kg: number;
    status: string;
    storage_deadline_at: string | null;
    notes: string | null;
};

type ApiErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

type CategoryApiResponse =
    | Category[]
    | {
        data?: Category[];
    };

const initialState = (): FormState => ({
    date: new Date().toISOString().slice(0, 10),
    waste_category_id: '',
    waste_code: '',
    waste_name: '',
    source: '',
    destination: '',
    transporter: '',
    manifest_number: '',
    weight_kg: '',
    storage_deadline_at: '',
    status: 'PENDING',
    notes: '',
    scale_photo: null,
});

async function parseErrorResponse(response: Response): Promise<string> {
    const result = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;

    if (result?.errors) {
        const firstError = Object.values(result.errors)
            .flat()
            .find(Boolean);

        if (firstError) {
            return firstError;
        }
    }

    return result?.message || `Permintaan gagal (${response.status}).`;
}

async function getWasteCategories(): Promise<Category[]> {
    const response = await fetch('/api/waste-categories', {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
    }

    const result = (await response.json()) as CategoryApiResponse;

    if (Array.isArray(result)) {
        return result;
    }

    return Array.isArray(result.data) ? result.data : [];
}

async function createB3Transaction(
    payload: B3TransactionPayload,
    scalePhoto: File | null,
): Promise<void> {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    if (scalePhoto) {
        formData.append('scale_photo', scalePhoto);
    }

    const response = await fetch('/api/b3-transactions', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
    }
}

export default function B3TransactionForm({
    type,
}: {
    type: TransactionType;
}) {
    const inputStyle = useInputStyle();

    const [form, setForm] = useState<FormState>(initialState);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [message, setMessage] = useState<{
        type: MessageType;
        text: string;
    } | null>(null);

    const incoming = type === 'IN';

    useEffect(() => {
        let active = true;

        async function loadCategories(): Promise<void> {
            try {
                setLoadingCategories(true);

                const rows: Category[] = await getWasteCategories();

                if (active) {
                    setCategories(rows);
                }
            } catch (error) {
                if (active) {
                    setMessage({
                        type: 'error',
                        text:
                            error instanceof Error
                                ? error.message
                                : 'Kategori limbah gagal dimuat. Pastikan API dan database aktif.',
                    });
                }
            } finally {
                if (active) {
                    setLoadingCategories(false);
                }
            }
        }

        void loadCategories();

        return () => {
            active = false;
        };
    }, []);

    const selectedCategory = useMemo(
        () =>
            categories.find(
                (category) =>
                    String(category.id) === form.waste_category_id,
            ),
        [categories, form.waste_category_id],
    );

    function update<K extends keyof FormState>(
        key: K,
        value: FormState[K],
    ): void {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    function chooseCategory(id: string): void {
        const category = categories.find(
            (item) => String(item.id) === id,
        );

        setForm((previous) => ({
            ...previous,
            waste_category_id: id,
            waste_code: category?.code ?? '',
            waste_name: category?.name ?? '',
        }));
    }

    function reset(): void {
        setForm(initialState());
        setMessage(null);
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setMessage(null);

        const weight = Number(form.weight_kg);

        if (
            !form.date ||
            !form.waste_category_id ||
            !Number.isFinite(weight) ||
            weight <= 0
        ) {
            setMessage({
                type: 'error',
                text: 'Lengkapi tanggal, kategori, dan jumlah limbah yang valid.',
            });

            return;
        }

        if (incoming && !form.source.trim()) {
            setMessage({
                type: 'error',
                text: 'Sumber limbah wajib diisi untuk B3 Masuk.',
            });

            return;
        }

        if (!incoming && !form.destination.trim()) {
            setMessage({
                type: 'error',
                text: 'Tujuan penyerahan wajib diisi untuk B3 Keluar.',
            });

            return;
        }

        const payload: B3TransactionPayload = {
            transaction_type: type,
            waste_category_id: Number(form.waste_category_id),
            waste_code: form.waste_code,
            waste_name: form.waste_name,
            date: form.date,
            source: incoming ? form.source.trim() : null,
            destination: incoming ? null : form.destination.trim(),
            transporter: form.transporter.trim() || null,
            manifest_number: form.manifest_number.trim() || null,
            weight_kg: weight,
            status: form.status,
            storage_deadline_at:
                incoming && form.storage_deadline_at
                    ? form.storage_deadline_at
                    : null,
            notes: form.notes.trim() || null,
        };

        try {
            setSubmitting(true);

            await createB3Transaction(payload, form.scale_photo);

            setMessage({
                type: 'success',
                text: `Data B3 ${incoming ? 'Masuk' : 'Keluar'} berhasil disimpan.`,
            });

            setForm(initialState());
        } catch (error) {
            setMessage({
                type: 'error',
                text:
                    error instanceof Error
                        ? error.message
                        : 'Data gagal disimpan.',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <FormPage
            title={`Input B3 ${incoming ? 'Masuk' : 'Keluar'}`}
            subtitle={
                incoming
                    ? 'Catat limbah B3 yang masuk ke tempat penyimpanan.'
                    : 'Catat penyerahan atau pengeluaran limbah B3.'
            }
        >
            {message && (
                <Message type={message.type}>{message.text}</Message>
            )}

            <form onSubmit={submit}>
                <FormCard title="Informasi transaksi">
                    <Grid>
                        <Field label="Tanggal transaksi" required>
                            <input
                                style={inputStyle}
                                type="date"
                                max={new Date()
                                    .toISOString()
                                    .slice(0, 10)}
                                value={form.date}
                                onChange={(event) =>
                                    update('date', event.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field label="Kategori limbah B3" required>
                            <select
                                style={inputStyle}
                                value={form.waste_category_id}
                                onChange={(event) =>
                                    chooseCategory(event.target.value)
                                }
                                disabled={loadingCategories}
                                required
                            >
                                <option value="">
                                    {loadingCategories
                                        ? 'Memuat kategori...'
                                        : 'Pilih kategori'}
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.code} — {category.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Kode limbah">
                            <input
                                style={inputStyle}
                                value={form.waste_code}
                                readOnly
                            />
                        </Field>

                        <Field label="Nama limbah">
                            <input
                                style={inputStyle}
                                value={form.waste_name}
                                readOnly
                                placeholder={
                                    selectedCategory?.name ?? ''
                                }
                            />
                        </Field>

                        <Field label="Jumlah (kg)" required>
                            <input
                                style={inputStyle}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.weight_kg}
                                onChange={(event) =>
                                    update(
                                        'weight_kg',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>

                        <Field label="Status">
                            <select
                                style={inputStyle}
                                value={form.status}
                                onChange={(event) =>
                                    update('status', event.target.value)
                                }
                            >
                                <option value="PENDING">Pending</option>
                                <option value="RECEIVED">Received</option>
                                <option value="PROCESSED">
                                    Processed
                                </option>
                                <option value="COMPLETED">
                                    Completed
                                </option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </Field>
                    </Grid>
                </FormCard>

                <FormCard
                    title={
                        incoming
                            ? 'Asal dan penyimpanan'
                            : 'Penyerahan'
                    }
                >
                    <Grid>
                        {incoming ? (
                            <Field label="Sumber limbah" required>
                                <input
                                    style={inputStyle}
                                    value={form.source}
                                    onChange={(event) =>
                                        update(
                                            'source',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Workshop UTPE"
                                    required
                                />
                            </Field>
                        ) : (
                            <Field label="Tujuan penyerahan" required>
                                <input
                                    style={inputStyle}
                                    value={form.destination}
                                    onChange={(event) =>
                                        update(
                                            'destination',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Nama pengelola atau penerima"
                                    required
                                />
                            </Field>
                        )}

                        {!incoming && (
                            <Field label="Pengangkut">
                                <input
                                    style={inputStyle}
                                    value={form.transporter}
                                    onChange={(event) =>
                                        update(
                                            'transporter',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        )}

                        <Field label="Nomor dokumen/manifest">
                            <input
                                style={inputStyle}
                                value={form.manifest_number}
                                onChange={(event) =>
                                    update(
                                        'manifest_number',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>

                        {incoming && (
                            <Field label="Batas maksimal penyimpanan">
                                <input
                                    style={inputStyle}
                                    type="date"
                                    min={form.date || undefined}
                                    value={form.storage_deadline_at}
                                    onChange={(event) =>
                                        update(
                                            'storage_deadline_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        )}

                        <Field
                            label="Foto timbangan"
                            hint="Upload foto bukti penimbangan fisik (Format: JPG, PNG, WEBP, Maks 5MB)."
                        >
                            <input
                                style={inputStyle}
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    update(
                                        'scale_photo',
                                        event.target.files?.[0] ??
                                        null,
                                    )
                                }
                            />
                        </Field>
                    </Grid>

                    {form.scale_photo && (
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                            }}
                        >
                            File dipilih: {form.scale_photo.name}
                        </div>
                    )}
                </FormCard>

                <FormCard title="Keterangan">
                    <Field label="Catatan">
                        <textarea
                            style={{
                                ...inputStyle,
                                minHeight: 95,
                                resize: 'vertical',
                            }}
                            maxLength={1000}
                            value={form.notes}
                            onChange={(event) =>
                                update('notes', event.target.value)
                            }
                        />
                    </Field>
                </FormCard>

                <FormActions
                    submitting={submitting}
                    onReset={reset}
                />
            </form>
        </FormPage>
    );
}