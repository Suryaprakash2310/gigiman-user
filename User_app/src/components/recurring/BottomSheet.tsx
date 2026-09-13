// src/components/recurring/BottomSheet.tsx
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import AppText from '../ui/AppText';

export interface RecurringBottomSheetRef {
  expand: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
}

interface BottomSheetProps {
  title?: string;
  children: React.ReactNode;
  snapPoints?: string[];
}

const RecurringBottomSheet = forwardRef<RecurringBottomSheetRef, BottomSheetProps>(
  ({ title, children, snapPoints = ['45%', '70%'] }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);

    useImperativeHandle(ref, () => ({
      expand: () => sheetRef.current?.expand(),
      close: () => sheetRef.current?.close(),
      snapToIndex: (index: number) => sheetRef.current?.snapToIndex(index),
    }));

    const renderBackdrop = React.useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.contentContainer}>
          {title && (
            <View style={styles.header}>
              <AppText weight="bold" style={styles.title}>
                {title}
              </AppText>
              <View style={styles.divider} />
            </View>
          )}
          <View style={styles.body}>
            {children}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

RecurringBottomSheet.displayName = 'RecurringBottomSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  indicator: {
    backgroundColor: '#E5E7EB',
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
    marginTop: 14,
  },
  body: {
    flex: 1,
  },
});

export default RecurringBottomSheet;
