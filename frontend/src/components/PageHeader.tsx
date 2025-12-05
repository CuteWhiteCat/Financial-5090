import React from 'react';
import { Box, Stack, Typography, SxProps, useTheme } from '@mui/material';

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'default' | 'light-on-dark';
  sx?: SxProps;
};

/**
 * Shared page header with an accent icon, title, subtitle, and optional actions.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  eyebrow,
  align = 'left',
  tone = 'default',
  sx = {},
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const forceLight = tone === 'light-on-dark';
  const primaryText = forceLight || isDarkMode ? '#f0f6fc' : theme.palette.text.primary;
  const secondaryText = forceLight || isDarkMode ? '#8b949e' : theme.palette.text.secondary;
  const accent = 'linear-gradient(90deg, #6ab8ff 0%, #7ee0ff 100%)';
  const iconBg = forceLight || isDarkMode
    ? 'linear-gradient(135deg, rgba(106,184,255,0.2) 0%, rgba(111,255,233,0.08) 100%)'
    : 'linear-gradient(135deg, rgba(33,150,243,0.12) 0%, rgba(33,150,243,0.06) 100%)';
  const borderColor = forceLight || isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <Box
      sx={{
        mb: align === 'center' ? 2.5 : 3,
        ...sx,
      }}
    >
      {align === 'center' ? (
        // 居中佈局: 所有元素垂直排列並居中
        <Stack
          spacing={2}
          alignItems="center"
          sx={{ width: '100%' }}
        >
          {icon && (
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: iconBg,
                border: `1px solid ${borderColor}`,
                boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                color: theme.palette.primary.light,
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            {eyebrow && (
              <Typography variant="overline" sx={{
                letterSpacing: 2,
                color: theme.palette.primary.light,
                display: 'block',
              }}>
                {eyebrow}
              </Typography>
            )}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: primaryText,
                textShadow: (forceLight || isDarkMode) ? '0 8px 24px rgba(0,0,0,0.45)' : 'none',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: secondaryText, mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            <Box
              sx={{
                mt: 1,
                height: 3,
                width: 72,
                background: accent,
                borderRadius: 999,
                boxShadow: '0 6px 20px rgba(106,184,255,0.35)',
                mx: 'auto',
              }}
            />
          </Box>
          {actions && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {actions}
            </Box>
          )}
        </Stack>
      ) : (
        // 左對齊佈局: 原本的橫向佈局
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="flex-start"
          justifyContent="space-between"
          gap={2}
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {icon && (
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: iconBg,
                  border: `1px solid ${borderColor}`,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                  color: theme.palette.primary.light,
                }}
              >
                {icon}
              </Box>
            )}
            <Box>
              {eyebrow && (
                <Typography variant="overline" sx={{
                  letterSpacing: 2,
                  color: theme.palette.primary.light,
                  display: 'block',
                }}>
                  {eyebrow}
                </Typography>
              )}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.3px',
                  color: primaryText,
                  textShadow: (forceLight || isDarkMode) ? '0 8px 24px rgba(0,0,0,0.45)' : 'none',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ color: secondaryText, mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
              <Box
                sx={{
                  mt: 1,
                  height: 3,
                  width: 72,
                  background: accent,
                  borderRadius: 999,
                  boxShadow: '0 6px 20px rgba(106,184,255,0.35)',
                }}
              />
            </Box>
          </Stack>
          {actions && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
              }}
            >
              {actions}
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default PageHeader;
