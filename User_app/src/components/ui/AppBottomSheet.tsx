// src/components/ui/AppBottomSheet.tsx
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Easing } from 'react-native-reanimated';

export interface AppBottomSheetRef {
  expand: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
}

interface Props {
  children: React.ReactNode;
  snapPoints?: string[];      // e.g. ["40%", "75%"]
  enableScroll?: boolean;     // wrap content in ScrollView or not
}

const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  ({ children, snapPoints = ['35%', '65%', '90%'], enableScroll = true }, ref) => {
    const { theme } = useTheme();
    const sheetRef = useRef<any>(null); // internal ref to @gorhom/bottom-sheet

    // expose only what rest of app needs
    useImperativeHandle(ref, () => ({
      expand: () => sheetRef.current?.expand?.(),
      close: () => sheetRef.current?.close?.(),
      snapToIndex: (index: number) => sheetRef.current?.snapToIndex?.(index),
    }));

    const snaps = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.35}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={sheetRef}
        snapPoints={snaps}
        index={-1} // hidden by default
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        animationConfigs={{
          duration: 200,
          easing: Easing.out(Easing.quad),
        }}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.border,
        }}
      >
        {enableScroll ? (
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
      </BottomSheet>
    );
  }
);

AppBottomSheet.displayName = 'AppBottomSheet';

export default AppBottomSheet;

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
});








// import React, { useRef } from 'react';
// import { View, TouchableOpacity } from 'react-native';
// import AppBottomSheet, { AppBottomSheetRef } from '@/src/components/ui/AppBottomSheet';
// import AppText from '@/src/components/ui/AppText';

// const ExampleScreen = () => {
//   const sheetRef = useRef<AppBottomSheetRef>(null);

//   return (
//     <View style={{ flex: 1 }}>
//       <TouchableOpacity onPress={() => sheetRef.current?.expand()}>
//         <AppText weight="bold">Open sub-services</AppText>
//       </TouchableOpacity>

//       <AppBottomSheet ref={sheetRef} snapPoints={['45%', '80%']}>
//         <AppText weight="bold" size="h2" style={{ marginBottom: 12 }}>
//           Electrical Services
//         </AppText>

//         {/* here later: list of fan, light, switch, etc */}
//       </AppBottomSheet>
//     </View>
//   );
// };

// export default ExampleScreen;
