import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppButton from './AppButton';
import AppInput from './AppInput';
import AppText from './AppText';

interface PersonalDetails {
    name: string;
    email: string;
    phone: string;
    address: string;
}

interface Props {
    initialValues?: PersonalDetails;
    onSubmit: (values: PersonalDetails) => void;
}

export default function PersonalDetailsCard({
    initialValues = {
        name: 'Alex Martinez',
        email: 'alex.math@gmail.com',
        phone: '7892233780',
        address: '123,north street, Norway',
    },
    onSubmit,
}: Props) {
    // Force light theme colors
    const themeColors = {
        surface: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#E2E8F0',
        success: '#10B981',
        danger: '#EF4444',
        cardShadow: 'rgba(0,0,0,0.06)',
        primary: '#3B82F6', // Blue for Edit button
    };

    const [values, setValues] = useState<PersonalDetails>(initialValues);
    const [editingField, setEditingField] = useState<keyof PersonalDetails | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof PersonalDetails, string>>>({});

    const validate = (field: keyof PersonalDetails, value: string): string | undefined => {
        switch (field) {
            case 'name':
                if (value.length > 30) return 'Name must be 30 characters or less';
                if (value.trim().length === 0) return 'Name is required';
                return undefined;
            case 'email':
                if (!value.endsWith('@gmail.com')) return 'Email must be a valid @gmail.com address';
                return undefined;
            case 'phone':
                if (!/^\d{10}$/.test(value)) return 'Phone number must be exactly 10 digits';
                return undefined;
            case 'address':
                if (value.length > 100) return 'Address must be 100 characters or less';
                if (value.trim().length === 0) return 'Address is required';
                return undefined;
            default:
                return undefined;
        }
    };

    const handleChange = (field: keyof PersonalDetails, text: string) => {
        // Specific input restrictions
        if (field === 'phone') {
            // Only allow numbers
            if (!/^\d*$/.test(text)) return;
            // Limit to 10 digits
            if (text.length > 10) return;
        }

        setValues((prev) => ({ ...prev, [field]: text }));

        // Real-time validation clearing
        const error = validate(field, text);
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleEdit = (field: keyof PersonalDetails) => {
        setEditingField(field);
    };

    const handleSave = () => {
        // Validate all fields
        const newErrors: Partial<Record<keyof PersonalDetails, string>> = {};
        let isValid = true;

        (Object.keys(values) as Array<keyof PersonalDetails>).forEach((key) => {
            const error = validate(key, values[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);

        if (isValid) {
            setEditingField(null);
            onSubmit(values);
        } else {
            Alert.alert('Invalid Details', 'Please correct the errors before saving.');
        }
    };

    const renderField = (
        label: string,
        field: keyof PersonalDetails,
        value: string,
        placeholder: string
    ) => {
        const isEditing = editingField === field;
        const error = errors[field];

        return (
            <View style={[styles.fieldContainer, { borderBottomColor: themeColors.border }]}>
                <View style={styles.fieldContent}>
                    <AppText size="body" weight="semibold" style={[styles.label, { color: themeColors.text }]}>
                        {label}
                    </AppText>

                    {isEditing ? (
                        <View>
                            {field === 'phone' && (
                                <AppText style={{ position: 'absolute', top: 12, left: 12, zIndex: 1, color: themeColors.text }}>+91</AppText>
                            )}
                            <AppInput
                                value={value}
                                onChangeText={(text) => handleChange(field, text)}
                                placeholder={placeholder}
                                autoFocus
                                keyboardType={field === 'phone' ? 'numeric' : 'default'}
                                style={{
                                    paddingLeft: field === 'phone' ? 45 : 16,
                                    height: 45,
                                    paddingVertical: 0,
                                    color: themeColors.text,
                                    backgroundColor: themeColors.surface,
                                    borderColor: error ? themeColors.danger : themeColors.border,
                                }}
                                error={error}
                            />
                        </View>
                    ) : (
                        <AppText size="body" style={[styles.valueText, { color: themeColors.textMuted }]}>
                            {field === 'phone' ? `+91 ${value}` : value}
                        </AppText>
                    )}
                </View>

                {!isEditing && (
                    <TouchableOpacity onPress={() => handleEdit(field)} style={styles.editButton}>
                        <AppText size="body" weight="medium" style={{ color: themeColors.primary }}>
                            Edit
                        </AppText>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: themeColors.surface, shadowColor: themeColors.cardShadow }]}>
            {renderField('Name', 'name', values.name, 'Enter your name')}
            {renderField('Email', 'email', values.email, 'Enter your email')}
            {renderField('Phone Number', 'phone', values.phone, 'Enter phone number')}
            {renderField('Address', 'address', values.address, 'Enter your address')}

            <View style={styles.buttonContainer}>
                <AppButton
                    title="Save Changes"
                    onPress={handleSave}
                    style={{ backgroundColor: themeColors.success, width: '100%' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
        marginHorizontal: 4,
    },
    fieldContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    fieldContent: {
        flex: 1,
        marginRight: 16,
    },
    label: {
        marginBottom: 4,
    },
    valueText: {
        marginTop: 2,
    },
    editButton: {
        padding: 8,
    },
    buttonContainer: {
        marginTop: 24,
    }
});
