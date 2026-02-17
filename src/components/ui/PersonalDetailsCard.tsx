import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppButton from './AppButton';
import AppInput from './AppInput';
import AppText from './AppText';

interface PersonalDetails {
    fullName: string;
    email: string;
    phoneNo: string;
}

interface Props {
    initialValues?: PersonalDetails;
    onSubmit: (values: PersonalDetails) => void;
}

export default function PersonalDetailsCard({
    initialValues = {
        fullName: '',
        email: '',
        phoneNo: '',
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
        primary: '#3B82F6',
    };

    const [values, setValues] = useState<PersonalDetails>(initialValues);
    const [editingField, setEditingField] = useState<keyof PersonalDetails | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof PersonalDetails, string>>>({});

    const editableFields: Array<keyof PersonalDetails> = ['fullName'];

    const validate = (field: keyof PersonalDetails, value: string): string | undefined => {
        switch (field) {
            case 'fullName':
                if (value.trim().length === 0) return 'Name is required';
                if (value.length > 30) return 'Name must be 30 characters or less';
                return undefined;
            case 'email':
                if (!value.endsWith('@gmail.com')) return 'Email must be a valid @gmail.com address';
                return undefined;
            case 'phoneNo':
                if (!/^\d{10}$/.test(value)) return 'Phone number must be exactly 10 digits';
                return undefined;
            default:
                return undefined;
        }
    };

    const handleChange = (field: keyof PersonalDetails, text: string) => {
        if (field === 'phoneNo') {
            if (!/^\d*$/.test(text)) return;
            if (text.length > 10) return;
        }

        setValues(prev => ({ ...prev, [field]: text }));

        const error = validate(field, text);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleEdit = (field: keyof PersonalDetails) => {
        if (!editableFields.includes(field)) return;
        setEditingField(field);
    };

    const handleSave = () => {
        const newErrors: Partial<Record<keyof PersonalDetails, string>> = {};
        let isValid = true;

        editableFields.forEach(field => {
            const error = validate(field, values[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);

        if (!isValid) {
            Alert.alert('Invalid Details', 'Please correct the errors before saving.');
            return;
        }

        setEditingField(null);
        onSubmit(values);
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
                            {field === 'phoneNo' && (
                                <AppText
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        left: 12,
                                        zIndex: 1,
                                        color: themeColors.text,
                                    }}
                                >
                                    +91
                                </AppText>
                            )}
                            <AppInput
                                value={value}
                                onChangeText={(text) => handleChange(field, text)}
                                placeholder={placeholder}
                                autoFocus
                                keyboardType={field === 'phoneNo' ? 'numeric' : 'default'}
                                style={{
                                    paddingLeft: field === 'phoneNo' ? 45 : 16,
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
                            {field === 'phoneNo' ? `+91 ${value}` : value}
                        </AppText>
                    )}
                </View>

                {!isEditing && editableFields.includes(field) && (
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
            {renderField('Name', 'fullName', values.fullName, 'Enter your name')}
            {renderField('Email', 'email', values.email, 'Enter your email')}
            {renderField('Phone Number', 'phoneNo', values.phoneNo, 'Enter phone number')}

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
    },
});
