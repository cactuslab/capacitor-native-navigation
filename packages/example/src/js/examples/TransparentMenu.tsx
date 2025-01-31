import { useNativeNavigationViewContext } from "capacitor-native-navigation-react";
import TallContent from "./TallContent";
import { useEffect } from "react";

export default function TransparentMenu() {
    const { updateView } = useNativeNavigationViewContext()
    
    useEffect( () => {
        updateView({
            stackItem: {
                bar: {
                    background: {
                        color: '#c8ffaf',
                    },
                    iOS: {
                        translucent: true,
                    }
                }
            }
        })
    }, [updateView])
        
    return (
        <TallContent />
    )
}