<script>
    import { goto } from '$app/navigation';
    import api from '$lib/api';
    import { endpoints } from '$lib/config';
    import toast from 'svelte-french-toast';
    import { User } from 'lucide-svelte';

    let username = '';
    let password = '';
    let isLoading = false;

    async function handleLogin() {
        isLoading = true;
        try {
            const response = await api.post(endpoints.auth.login, { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            toast.success('Logged in successfully!');
            goto('/dashboard/tree');
        } catch (error) {
            console.error(error);
            toast.error('Invalid credentials');
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center mb-6">
             <div class="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 rounded-full shadow-lg shadow-emerald-500/20">
                <User size={48} color="white" />
            </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
        </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
            <form class="space-y-6" on:submit|preventDefault={handleLogin}>
                <div>
                    <label for="username" class="block text-sm font-medium text-gray-300">
                        Username
                    </label>
                    <div class="mt-1">
                        <input 
                            id="username" 
                            name="username" 
                            type="text" 
                            required 
                            bind:value={username}
                            class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white" 
                        />
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-300">
                        Password
                    </label>
                    <div class="mt-1">
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            required 
                            bind:value={password}
                            class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white" 
                        />
                    </div>
                </div>

                <div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>

            <div class="mt-6">
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-600"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-gray-800 text-gray-400">
                            New here?
                        </span>
                    </div>
                </div>

                <div class="mt-6">
                    <a 
                        href="/register"
                        class="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-emerald-400 bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        Create an account
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
