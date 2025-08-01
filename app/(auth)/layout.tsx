const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return ( 
        <div className="bg-blue-100 h-full">
            {children}
        </div> 
    );
}
 
export default AuthLayout;