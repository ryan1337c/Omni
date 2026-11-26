import supabase from "./supabaseClient";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  assertLength,
  assertPassword,
} from "./inputLimits";


export class AuthServices {
  // login
  async login(email, password) {
    assertLength(email, MAX_EMAIL_LENGTH, "Email");
    assertPassword(password);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    return data;
  }

  // Signup
  async signup(firstName, lastName, email, password) {
    assertLength(firstName, MAX_FIRST_NAME_LENGTH, "First name");
    assertLength(lastName, MAX_LAST_NAME_LENGTH, "Last name");
    assertLength(email, MAX_EMAIL_LENGTH, "Email");
    assertPassword(password, { requireMin: true });

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: "https://omni-7y2c.vercel.app/pages/confirm",
        data: {
          firstName: firstName,
          lastName: lastName,
        },
      },
    });

    // const { data, error } = await supabase.auth.signUp({
    //   email: email,
    //   password: password,
    //   options: {
    //     emailRedirectTo: "http://localhost:3000/pages/confirm",
    //     data: {
    //       firstName: firstName,
    //       lastName: lastName,
    //     },
    //   },
    // });

    if (error) throw error;

    // Check if email is already taken (e.g., user exists with a different auth method)
    const identities = data?.user?.identities;

    if (!identities || identities.length === 0) {
      throw new Error("Email address is already taken");
    }

    return data;
  }

  // logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // create session
  async createSession(access_token, refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) throw error;

    return data;
  }

  // get user
  async getSession() {
    const { data } = await supabase.auth.getSession();

    if (!data?.session) {
      throw Error("No active session"); // No active session
    }

    return data.session;
  }

  // OAuth sign in
  async oAuthSignup() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://omni-7y2c.vercel.app/pages/authConfirm",
      },
    });

    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: "google",
    //   options: {
    //     redirectTo: "http://localhost:3000/pages/authConfirm",
    //   },
    // });

    if (error) throw error;

    return data;
  }

  // Resend email confirmation
  async resendConfirmation(email) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: "https://omni-7y2c.vercel.app/pages/confirm",
      },
    });

    // const { error } = await supabase.auth.resend({
    //   type: "signup",
    //   email: email,
    //   options: {
    //     emailRedirectTo: "http://localhost:3000/pages/confirm",
    //   },
    // });

    if (error) throw error;
  }

  // Send reset link to email
  async sendResetLink(email) {
    assertLength(email, MAX_EMAIL_LENGTH, "Email");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://omni-7y2c.vercel.app/pages/recovery/newPassword",
    });

    // const { error } = await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: "http://localhost:3000/pages/recovery/newPassword",
    // });

    if (error) throw error;
  }

  // Update user
  async updateUser(new_password) {
    assertPassword(new_password, { requireMin: true });

    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (error) throw error;
  }

  async updateProfileName(name) {
    assertLength(name, MAX_DISPLAY_NAME_LENGTH, "Name");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });

    if (error) throw error;
  }

  get client() {
    return supabase;
  }
}
