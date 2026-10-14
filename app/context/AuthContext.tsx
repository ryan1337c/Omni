'use client'
import { useContext, createContext, useEffect, useState, ReactNode} from "react";
import { AuthServices } from "@/lib/authServices";
import type { AuthChangeEvent, RealtimeChannel, Session, User } from "@supabase/supabase-js";
import { PublicServices } from "@/lib/publicServices";

function getUserFullName(user: User | null | undefined): string | null {
    if (!user) return null;

    const metadata = user.user_metadata ?? {};
    const fullName =
        metadata.full_name ||
        metadata.name ||
        [metadata.firstName, metadata.lastName].filter(Boolean).join(" ");

    return typeof fullName === "string" && fullName.trim()
        ? fullName.trim()
        : null;
}

// Shape of context
interface AuthContextType {
    isLoggedIn: boolean;
    fullName: string | null;
    tier: string | null;
    chatMode: string;
    setChatMode: (mode: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth = new AuthServices();
const publicServices = new PublicServices();

// Provider node
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string | null>(null);
    const [chatMode, setChatModeState] = useState("new chat"); // new chat, recents, chat, quiz, flashcards, resume
    const [tier, setTier] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Recover mode on mount
    useEffect(() => {
        // if (typeof window !== "undefined") {
        //     const savedMode = localStorage.getItem("chatMode");
        //     if (savedMode) {
        //         setChatModeState(savedMode);
        //     }
        // };
        setIsInitialized(true);
    }, [])

    const setChatMode = (mode: string) => {
        setChatModeState(mode);
        // if (typeof window !== "undefined") {
        //     localStorage.setItem("chatMode", mode)
        // }
    }

    useEffect(() => {

        // listen to login/logout
        const supabase = auth.client;
        let requestVersion = 0;
        let entitlementChannel: RealtimeChannel | null = null;
        let subscribedUserId: string | null = null;

        const loadTier = async (userId: string) => {
            const currentVersion = ++requestVersion;
            setTier(null);
            setTimeout(() => {
                publicServices.getSubscription(userId)
                    .then((result) => {
                        // Ignore results from an outdated request
                        if (currentVersion === requestVersion) {
                            setTier(result);
                        }
                    })
                    .catch(console.error);
            }, 0);
        }

        const stopEntitlementUpdates = () => {
            if (entitlementChannel) {
                supabase.removeChannel(entitlementChannel);
                entitlementChannel = null;
                subscribedUserId = null;
            }
        };

        const listenForEntitlementUpdates = (userId: string) => {
            if (subscribedUserId === userId) return;

            stopEntitlementUpdates();
            subscribedUserId = userId;
            entitlementChannel = supabase
                .channel(`user-entitlement:${userId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "user_entitlements",
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        const updatedEntitlement = payload.new as { tier?: string };

                        if (updatedEntitlement.tier) {
                            requestVersion++;
                            setTier(updatedEntitlement.tier);
                        }
                    },
                )
                .subscribe((status) => {
                    if (status === "CHANNEL_ERROR") {
                        console.error("Failed to subscribe to entitlement updates");
                    }
                });
        };

        const clearAuth = () => {
            requestVersion++; // Invalidates any pending tier request
            stopEntitlementUpdates();
            setIsLoggedIn(false);
            setFullName(null);
            setTier(null);
        };

        const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            console.log(event, session)

            if (event === 'INITIAL_SESSION') {
                if (session?.user) {
                    setIsLoggedIn(true);
                    setFullName(getUserFullName(session.user));
                    listenForEntitlementUpdates(session.user.id);
                    loadTier(session.user.id);
                }
                else {
                    clearAuth();
                }
            } else if (event === 'SIGNED_IN') {
                if (session?.user) {
                    setIsLoggedIn(true);
                    setFullName(getUserFullName(session.user));
                    listenForEntitlementUpdates(session.user.id);
                    loadTier(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                clearAuth();
            } else if (event === 'PASSWORD_RECOVERY') {
                // handle password recovery event
            } else if (event === 'TOKEN_REFRESHED') {
                // handle token refreshed event
            } else if (event === 'USER_UPDATED') {
                setFullName(getUserFullName(session?.user));
            }
            })

            // call unsubscribe to remove the callback
            return () => {
                requestVersion++; // Invalidate any pending tier request
                stopEntitlementUpdates();
                data.subscription.unsubscribe()
            };

        }, []);

        // Prevents rendering children until we know the correct chatMode
        if (!isInitialized)
            return null;

    return (
        <AuthContext.Provider value={{ isLoggedIn, fullName, tier, chatMode, setChatMode }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using useContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

