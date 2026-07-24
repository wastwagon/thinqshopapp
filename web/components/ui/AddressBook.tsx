'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/ui/FormField';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';

const addressSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    region: z.string().min(1, 'Region is required'),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
    landmark: z.string().optional(),
    is_default: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address extends AddressFormData {
    id: number;
}

interface AddressBookProps {
    onSelect?: (address: Address) => void;
    selectedId?: number;
}

export default function AddressBook({ onSelect, selectedId }: AddressBookProps) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
    });

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get('/addresses');
            setAddresses(data);
        } catch {
            toast.error('Failed to load addresses');
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const onSubmit = async (data: AddressFormData) => {
        try {
            if (editingId) {
                await api.patch(`/addresses/${editingId}`, data);
                toast.success('Address updated');
            } else {
                await api.post('/addresses', data);
                toast.success('Address added');
            }
            setIsAdding(false);
            setEditingId(null);
            reset();
            fetchAddresses();
        } catch {
            toast.error('Failed to save address');
        }
    };

    const confirmDelete = async () => {
        if (deleteId == null) return;
        setDeleting(true);
        try {
            await api.delete(`/addresses/${deleteId}`);
            toast.success('Address deleted');
            setDeleteId(null);
            fetchAddresses();
        } catch {
            toast.error('Failed to delete address');
        } finally {
            setDeleting(false);
        }
    };

    const startEdit = (address: Address) => {
        setEditingId(address.id);
        setIsAdding(true);
        setValue('full_name', address.full_name);
        setValue('phone', address.phone);
        setValue('street', address.street);
        setValue('city', address.city);
        setValue('region', address.region);
        setValue('state', address.state);
        setValue('zip_code', address.zip_code);
        setValue('country', address.country);
        setValue('landmark', address.landmark);
        setValue('is_default', address.is_default);
    };

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <MapPin className="mr-3 h-4 w-4 text-brand" /> Saved Addresses
                </h3>
                {!isAdding && (
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setIsAdding(true);
                            reset();
                            setEditingId(null);
                        }}
                    >
                        Add Address
                    </Button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit(onSubmit)} className="flat-card bg-gray-50/50 p-6 sm:p-8 mb-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Full name" htmlFor="addr-name" error={errors.full_name?.message}>
                            <Input id="addr-name" {...register('full_name')} invalid={!!errors.full_name} />
                        </FormField>
                        <FormField label="Phone number" htmlFor="addr-phone" error={errors.phone?.message}>
                            <Input id="addr-phone" {...register('phone')} invalid={!!errors.phone} />
                        </FormField>
                        <FormField
                            label="Delivery address / street"
                            htmlFor="addr-street"
                            error={errors.street?.message}
                            className="md:col-span-2"
                        >
                            <Input id="addr-street" {...register('street')} invalid={!!errors.street} />
                        </FormField>
                        <FormField label="City / town" htmlFor="addr-city" error={errors.city?.message}>
                            <Input id="addr-city" {...register('city')} invalid={!!errors.city} />
                        </FormField>
                        <FormField label="Region" htmlFor="addr-region" error={errors.region?.message}>
                            <Select id="addr-region" {...register('region')} invalid={!!errors.region}>
                                <option value="">Select Region</option>
                                <option value="Greater Accra">Greater Accra</option>
                                <option value="Ashanti">Ashanti</option>
                                <option value="Central">Central</option>
                                <option value="Eastern">Eastern</option>
                                <option value="Western">Western</option>
                            </Select>
                        </FormField>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="addr-default"
                            {...register('is_default')}
                            className="h-5 w-5 rounded-lg border-gray-300 text-brand focus:ring-brand/20"
                        />
                        <label htmlFor="addr-default" className="text-sm font-medium text-gray-600">
                            Set as primary destination
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Address'}
                        </Button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {addresses.map((address) => (
                    <div
                        key={address.id}
                        className={cn(
                            'group flat-card p-6 relative transition-colors',
                            selectedId === address.id && 'border-brand ring-4 ring-brand/10'
                        )}
                    >
                        {address.is_default && (
                            <Badge variant="brand" className="absolute top-6 right-6">
                                Primary
                            </Badge>
                        )}
                        <div className="flex items-start mb-6">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-50 transition-colors">
                                <MapPin
                                    className={cn(
                                        'h-5 w-5',
                                        selectedId === address.id ? 'text-brand' : 'text-gray-400 group-hover:text-brand'
                                    )}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">{address.street}</p>
                                <p className="text-xs font-medium text-gray-500">
                                    {address.city}, {address.region}
                                </p>
                                <p className="text-xs font-medium text-gray-400 mt-2">
                                    {address.full_name} • {address.phone}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {onSelect ? (
                                <Button
                                    type="button"
                                    onClick={() => onSelect(address)}
                                    variant={selectedId === address.id ? 'primary' : 'secondary'}
                                    size="sm"
                                    className="flex-1"
                                >
                                    {selectedId === address.id ? 'Selected' : 'Use this address'}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1"
                                        leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                                        onClick={() => startEdit(address)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                                        onClick={() => setDeleteId(address.id)}
                                    >
                                        Remove
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={deleteId != null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete address?"
                description="This address will be removed from your account."
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
