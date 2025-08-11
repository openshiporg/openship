'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Platform {
  id: string;
  name: string;
  oAuthFunction?: string;
  oAuthCallbackFunction?: string;
}

interface ChannelCreationFieldsProps {
  platform: Platform;
  value: any;
  onChange: (value: any) => void;
  onInstallApp?: (domain: string) => void;
}

export function ChannelCreationFields({ 
  platform, 
  value, 
  onChange,
  onInstallApp 
}: ChannelCreationFieldsProps) {
  const [domain, setDomain] = useState('');
  
  const hasOAuth = platform.oAuthFunction && platform.oAuthCallbackFunction;

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDomain = e.target.value;
    setDomain(newDomain);
    
    // For OAuth platforms, we need to ensure all required fields have proper structure
    // Generate a temporary name from domain
    const tempName = newDomain ? `${platform.name} - ${newDomain}` : '';
    
    // Update the form value with domain and other required fields for OAuth
    onChange({
      ...value,
      domain: { kind: 'value' as const, value: newDomain },
      name: { kind: 'value' as const, value: tempName },
      // OAuth will provide the access token later, but we need empty structure for now
      accessToken: { kind: 'value' as const, value: '' }
    });
  };

  const handleInstallApp = () => {
    if (domain && onInstallApp) {
      onInstallApp(domain);
    }
  };

  if (hasOAuth) {
    // Show OAuth flow: domain input only (button will be in dialog footer)
    return (
      <div className="space-y-2">
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          type="text"
          placeholder="your-channel-domain.com"
          value={domain}
          onChange={handleDomainChange}
          className="bg-muted/40"
        />
      </div>
    );
  }

  // Show manual fields: name, domain, access token
  const handleInputChange = (field: string, inputValue: string) => {
    onChange({
      ...value,
      [field]: { kind: 'value' as const, value: inputValue }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Channel name"
          value={value?.name?.value || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="bg-muted/40"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          type="text"
          placeholder="your-channel-domain.com"
          value={value?.domain?.value || ''}
          onChange={(e) => handleInputChange('domain', e.target.value)}
          className="bg-muted/40"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          type="text"
          placeholder="Enter access token"
          value={value?.accessToken?.value || ''}
          onChange={(e) => handleInputChange('accessToken', e.target.value)}
          className="bg-muted/40"
        />
      </div>
    </div>
  );
}