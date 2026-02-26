'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus, MapPin } from 'lucide-react';

const addressSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    phone: z.string().min(10, "Phone must be at least 10 characters"),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    region: z.string().min(1, "Region is required"),
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

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
    });

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get('/addresses');
            setAddresses(data);
        } catch (error) {
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
        } catch (error) {
            toast.error('Failed to save address');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/addresses/${id}`);
            toast.success('Address deleted');
            fetchAddresses();
        } catch (error) {
            toast.error('Failed to delete address');
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
                    <MapPin className="mr-3 h-4 w-4 text-blue-600" /> Saved Addresses
                </h3>
                {!isAdding && (
                    <button
                        onClick={() => { setIsAdding(true); reset(); setEditingId(null); }}
                        className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Add Address
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 mb-8 space-y-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                            <input {...register('full_name')} className="block w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                            {errors.full_name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{errors.full_name.message}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                            <input {...register('phone')} className="block w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{errors.phone.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Delivery Address / Street</label>
                            <input {...register('street')} className="block w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                            {errors.street && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{errors.street.message}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">City / Town</label>
                            <input {...register('city')} className="block w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                            {errors.city && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{errors.city.message}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Region</label>
                            <select {...register('region')} className="block w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                                <option value="">Select Region</option>
                                <option value="Greater Accra">Greater Accra</option>
                                <option value="Ashanti">Ashanti</option>
                                <option value="Central">Central</option>
                                <option value="Eastern">Eastern</option>
                                <option value="Western">Western</option>
                            </select>
                            {errors.region && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{errors.region.message}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" {...register('is_default')} className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Set as primary destination</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-gray-200">
                            {isSubmitting ? 'Saving...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {addresses.map((address) => (
                    <div key={address.id} className={`group bg-white border rounded-[2rem] p-6 relative hover:shadow-xl transition-all duration-300 ${selectedId === address.id ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-100'}`}>
                        {address.is_default && (
                            <span className="absolute top-6 right-6 bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Primary</span>
                        )}
                        <div className="flex items-start mb-6">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-50 transition-colors">
                                <MapPin className={`h-5 w-5 ${selectedId === address.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">{address.street}</p>
                                <p className="text-xs font-medium text-gray-500">{address.city}, {address.region}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{address.full_name} • {address.phone}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {onSelect ? (
                                <button
                                    onClick={() => onSelect(address)}
                                    className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all ${selectedId === address.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white'
                                        }`}
                                >
                                    {selectedId === address.id ? 'Selected' : 'Use this address'}
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(address)} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-900 hover:text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-all">
                                        <Edit2 className="h-3.5 w-3.5" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(address.id)} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-all">
                                        <Trash2 className="h-3.5 w-3.5" /> Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
